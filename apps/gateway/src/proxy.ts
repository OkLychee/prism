import { Env } from './types';
import { KeyService } from './services/key.service';
import { UpstreamService } from './services/upstream.service';
import { AuditLogService } from './services/audit.service';
import { SettingsService } from './services/settings.service';
import { getDb } from './db';
import { ProviderFactory } from './providers';
import {
  anthropicToOpenAiPayload,
  openAiToAnthropicResponse,
  createOpenAiToAnthropicSseTransform,
} from './adapter';

export async function proxyAndAuditRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  params: {
    protocol: 'openai' | 'anthropic';
    upstreamPath: string;
    keyRecord: any;
    bodyJson: any;
  }
): Promise<Response> {
  const { protocol, upstreamPath, keyRecord, bodyJson } = params;
  const startTime = Date.now();
  const modelName = bodyJson.model;
  let upstreamApiKey = '';

  const db = getDb(env.DB);
  const upstreamService = new UpstreamService(db);
  const keyService = new KeyService(db);
  const auditService = new AuditLogService(db);
  const settingsService = new SettingsService(db);

  // Parse allowed_models array from keyRecord
  let allowedModelsArray: string[] = [];
  try {
    allowedModelsArray = typeof keyRecord.allowed_models === 'string'
      ? JSON.parse(keyRecord.allowed_models)
      : keyRecord.allowed_models || [];
  } catch {
    allowedModelsArray = [];
  }

  // Find preferred upstream_id for this model if specified as composite key "upstream_id::model"
  let preferredUpstreamId: string | undefined;
  for (const item of allowedModelsArray) {
    if (item.includes('::')) {
      const [uId, mName] = item.split('::');
      if (mName === modelName) {
        preferredUpstreamId = uId;
        break;
      }
    }
  }

  // Fetch configured upstream for model & global CF settings
  const customConfig = await upstreamService.findConfigForModel(modelName, preferredUpstreamId);
  const globalSettings = await settingsService.getAllSettings();

  const cfAccountId = globalSettings.cf_account_id || '';
  const cfGatewayId = globalSettings.cf_gateway_id || 'default';
  const cfApiToken = globalSettings.cf_api_token || '';

  // Target upstream protocol format (default to 'openai' if unspecified)
  const upstreamProtocol = customConfig?.api_protocol || 'openai';

  // Determine if cross-protocol translation is needed (Anthropic Agent -> OpenAI Upstream)
  const isAnthropicToOpenAi = protocol === 'anthropic' && upstreamProtocol === 'openai';

  const forwardedPayload = isAnthropicToOpenAi
    ? anthropicToOpenAiPayload(bodyJson)
    : bodyJson;

  const effectiveUpstreamPath = isAnthropicToOpenAi ? '/v1/chat/completions' : upstreamPath;

  // Construct target URL & headers via ProviderFactory / Custom Endpoint
  let targetUrl = '';
  let providerCustomHeaders: Record<string, string> = {};

  if (customConfig) {
    upstreamApiKey = customConfig.api_key;

    if (customConfig.provider_type === 'cf_workers_ai') {
      // Mode 1: Cloudflare Workers AI (env.AI.run)
      if (env.AI) {
        try {
          const aiResult = await env.AI.run(
            modelName,
            bodyJson,
            {
              gateway: {
                id: cfGatewayId,
                skipCache: false,
              },
            }
          );

          const durationMs = Date.now() - startTime;
          const logId = crypto.randomUUID();
          const responseStr = typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult);

          const storageEngine = (globalSettings.log_storage_engine as 'd1' | 'r2') || 'd1';

          ctx.waitUntil(
            auditService.recordLog(
              {
                logId,
                keyId: keyRecord.id,
                protocol,
                modelName,
                bodyJson,
                responseContent: responseStr,
                promptTokens: 0,
                completionTokens: 0,
                durationMs,
                candidateName: keyRecord.candidate_name,
              },
              storageEngine,
              env.LOG_BUCKET
            )
          );

          return new Response(responseStr, {
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (err: any) {
          return new Response(
            JSON.stringify({
              error: {
                message: `Failed to execute model via env.AI.run binding: ${err.message || err}`,
                type: 'workers_ai_execution_error',
              },
            }),
            { status: 502, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({
            error: {
              message: `env.AI binding is not available in current environment for model '${modelName}'.`,
              type: 'env_ai_missing',
            },
          }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (customConfig.provider_type === 'cf_ai_gateway') {
      // Mode 2: Cloudflare AI Gateway Provider Native HTTP Endpoint (Support BYOK & Unified Billing)
      // Directly retrieve slug from customConfig.cf_aig_provider (fallback to 'openai' if empty)
      const slug = customConfig.cf_aig_provider || 'openai';

      const providerHandler = ProviderFactory.getHandler(slug);
      const requestBuilt = providerHandler.buildRequest({
        cfAccountId,
        cfGatewayId,
        cfApiToken,
        upstreamApiKey,
        effectiveUpstreamPath,
        customBaseUrl: customConfig.base_url,
        incomingHeaders: request.headers,
      });

      targetUrl = requestBuilt.targetUrl;
      providerCustomHeaders = requestBuilt.headers;
    } else {
      // Mode 3: Custom Endpoint (Pure BYOK / Direct BaseURL Proxy)
      const cleanBase = customConfig.base_url.replace(/\/+$/, '');
      if (cleanBase.endsWith('/v1') && effectiveUpstreamPath.startsWith('/v1')) {
        targetUrl = `${cleanBase}${effectiveUpstreamPath.replace('/v1', '')}`;
      } else {
        targetUrl = `${cleanBase}${effectiveUpstreamPath}`;
      }
    }
  } else {
    return new Response(
      JSON.stringify({
        error: {
          message: `No upstream provider configuration found for model '${modelName}'. Please configure an upstream in the dashboard.`,
          type: 'no_upstream_configured',
        },
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Prepare Forward Headers
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('authorization');
  headers.delete('x-api-key');

  // Apply Provider Factory headers if cf_ai_gateway mode, or fallback headers for custom endpoints
  if (customConfig?.provider_type === 'cf_ai_gateway') {
    Object.entries(providerCustomHeaders).forEach(([k, v]) => {
      headers.set(k, v);
    });

    // Ensure Authenticated Gateway header (cf-aig-authorization) is ALWAYS present for AI Gateway
    if (cfApiToken) {
      headers.set('cf-aig-authorization', `Bearer ${cfApiToken}`);
    }
  } else {
    if (upstreamApiKey) {
      headers.set('Authorization', `Bearer ${upstreamApiKey}`);
    }
  }

  // Forward Request
  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: JSON.stringify(forwardedPayload),
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: {
          message: `Failed to connect to upstream LLM at ${targetUrl}: ${err.message || err}`,
          type: 'upstream_error',
        },
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const contentType = upstreamResponse.headers.get('content-type') || '';
  const isSSE = contentType.includes('text/event-stream') || forwardedPayload.stream === true;

  if (isSSE && upstreamResponse.body) {
    // =======================================================
    // SSE Stream Handling & Token Usage Parsing (Fix for SSE)
    // =======================================================
    const [clientStream, auditStream] = upstreamResponse.body.tee();
    let promptTokens = 0;
    let completionTokens = 0;
    let responseContent = '';

    ctx.waitUntil(
      (async () => {
        const reader = auditStream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;

            const dataStr = trimmed.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              // Extract text content chunk
              if (parsed.choices?.[0]?.delta?.content) {
                if (responseContent.length < 4000) {
                  responseContent += parsed.choices[0].delta.content;
                }
              } else if (parsed.delta?.text) {
                if (responseContent.length < 4000) {
                  responseContent += parsed.delta.text;
                }
              }

              // Extract Token usage from SSE stream
              // 1. OpenAI stream_options: { include_usage: true } chunk
              // 2. Anthropic message_delta or message_start usage
              if (parsed.usage) {
                promptTokens = parsed.usage.prompt_tokens || parsed.usage.input_tokens || promptTokens;
                completionTokens = parsed.usage.completion_tokens || parsed.usage.output_tokens || completionTokens;
              } else if (parsed.type === 'message_start' && parsed.message?.usage) {
                promptTokens = parsed.message.usage.input_tokens || promptTokens;
              } else if (parsed.type === 'message_delta' && parsed.usage) {
                completionTokens = parsed.usage.output_tokens || completionTokens;
              }
            } catch {
              // Ignore non-JSON SSE lines
            }
          }
        }

        const totalTokens = promptTokens + completionTokens;
        const durationMs = Date.now() - startTime;
        const logId = crypto.randomUUID();

        if (totalTokens > 0) {
          await keyService.addQuotaUsed(keyRecord.id, totalTokens);
        }

        const storageEngine = (globalSettings.log_storage_engine as 'd1' | 'r2') || 'd1';

        await auditService.recordLog(
          {
            logId,
            keyId: keyRecord.id,
            protocol,
            modelName,
            bodyJson,
            responseContent,
            promptTokens,
            completionTokens,
            durationMs,
            candidateName: keyRecord.candidate_name,
          },
          storageEngine,
          env.LOG_BUCKET
        );
      })()
    );

    // If Anthropic Agent called OpenAI Upstream, translate OpenAI SSE stream to Anthropic SSE stream
    const finalStream = isAnthropicToOpenAi
      ? clientStream.pipeThrough(createOpenAiToAnthropicSseTransform(modelName))
      : clientStream;

    return new Response(finalStream, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: {
        'Content-Type': isAnthropicToOpenAi ? 'text/event-stream; charset=utf-8' : upstreamResponse.headers.get('content-type') || 'text/event-stream',
      },
    });
  } else {
    // =======================================================
    // Non-Streaming JSON Response Handling
    // =======================================================
    const responseClone = upstreamResponse.clone();

    ctx.waitUntil(
      (async () => {
        let promptTokens = 0;
        let completionTokens = 0;
        let responseContent = '';

        try {
          const resText = await responseClone.text();
          responseContent = resText;

          const resJson = JSON.parse(resText);
          if (resJson.usage) {
            promptTokens = resJson.usage.prompt_tokens || resJson.usage.input_tokens || 0;
            completionTokens = resJson.usage.completion_tokens || resJson.usage.output_tokens || 0;
          }
        } catch {
          // Ignore parsing errors
        }

        const totalTokens = promptTokens + completionTokens;
        const durationMs = Date.now() - startTime;
        const logId = crypto.randomUUID();

        if (totalTokens > 0) {
          await keyService.addQuotaUsed(keyRecord.id, totalTokens);
        }

        const storageEngine = (globalSettings.log_storage_engine as 'd1' | 'r2') || 'd1';

        await auditService.recordLog(
          {
            logId,
            keyId: keyRecord.id,
            protocol,
            modelName,
            bodyJson,
            responseContent,
            promptTokens,
            completionTokens,
            durationMs,
            candidateName: keyRecord.candidate_name,
          },
          storageEngine,
          env.LOG_BUCKET
        );
      })()
    );

    if (isAnthropicToOpenAi) {
      try {
        const openAiResJson = await upstreamResponse.json();
        const anthropicResJson = openAiToAnthropicResponse(openAiResJson);
        return new Response(JSON.stringify(anthropicResJson), {
          status: upstreamResponse.status,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {
        return upstreamResponse;
      }
    }

    return upstreamResponse;
  }
}
