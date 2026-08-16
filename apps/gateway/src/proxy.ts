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

  const isDebug = env.DEBUG === 'true' || env.DEBUG === '1';
  const debugTrace: any = isDebug
    ? {
        incoming_request: {
          protocol,
          upstream_path: upstreamPath,
          headers: Object.fromEntries(request.headers.entries()),
          body: bodyJson,
          translated_payload: isAnthropicToOpenAi ? forwardedPayload : undefined,
        },
        outgoing_upstream: {
          target_url: targetUrl,
          headers: Object.fromEntries(headers.entries()),
        },
        upstream_response: {},
        parsed_chunks: [],
      }
    : undefined;

  // Forward Request
  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: JSON.stringify(forwardedPayload),
    });

    if (debugTrace) {
      debugTrace.upstream_response = {
        status: upstreamResponse.status,
        status_text: upstreamResponse.statusText,
        headers: Object.fromEntries(upstreamResponse.headers.entries()),
      };
    }
  } catch (err: any) {
    if (debugTrace) {
      debugTrace.error = err.message || String(err);
    }
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
    let cacheReadInputTokens = 0;
    let cacheCreationInputTokens = 0;
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

              if (debugTrace && debugTrace.parsed_chunks.length < 500) {
                debugTrace.parsed_chunks.push(parsed);
              }

              // Extract text content chunk (Supports Chat Completions & Responses API)
              if (parsed.choices?.[0]?.delta?.content) {
                if (responseContent.length < 50000) {
                  responseContent += parsed.choices[0].delta.content;
                }
              } else if (parsed.delta?.text) {
                if (responseContent.length < 50000) {
                  responseContent += parsed.delta.text;
                }
              } else if (typeof parsed.delta === 'string') {
                if (responseContent.length < 50000) {
                  responseContent += parsed.delta;
                }
              } else if (parsed.type === 'response.text.delta' && typeof parsed.delta === 'string') {
                if (responseContent.length < 50000) {
                  responseContent += parsed.delta;
                }
              } else if (parsed.item?.content?.[0]?.text) {
                // OpenAI Responses API item completion
                if (!responseContent && responseContent.length < 50000) {
                  responseContent = parsed.item.content[0].text;
                }
              }

              // Extract Token usage from SSE stream
              // 1. OpenAI Chat Completions (prompt_tokens_details.cached_tokens / usage.prompt_tokens)
              // 2. OpenAI Responses API (response.completed / response.done: usage.input_tokens_details.cached_tokens / input_tokens)
              // 3. Anthropic message_delta / message_start (cache_read_input_tokens)
              const usageObj = parsed.usage || parsed.response?.usage;
              if (usageObj) {
                promptTokens = usageObj.prompt_tokens ?? usageObj.input_tokens ?? promptTokens;
                completionTokens = usageObj.completion_tokens ?? usageObj.output_tokens ?? completionTokens;
                cacheReadInputTokens =
                  usageObj.prompt_tokens_details?.cached_tokens ??
                  usageObj.input_tokens_details?.cached_tokens ??
                  usageObj.cache_read_input_tokens ??
                  cacheReadInputTokens;
                cacheCreationInputTokens = usageObj.cache_creation_input_tokens ?? cacheCreationInputTokens;
              } else if (parsed.type === 'message_start' && parsed.message?.usage) {
                promptTokens = parsed.message.usage.input_tokens ?? promptTokens;
                cacheReadInputTokens = parsed.message.usage.cache_read_input_tokens ?? cacheReadInputTokens;
                cacheCreationInputTokens = parsed.message.usage.cache_creation_input_tokens ?? cacheCreationInputTokens;
              } else if (parsed.type === 'message_delta' && parsed.usage) {
                completionTokens = parsed.usage.output_tokens ?? completionTokens;
              }
            } catch {
              // Ignore non-JSON SSE lines
            }
          }
        }

        // Quota deduction: Only charge uncached prompt tokens + completion tokens
        const uncachedPromptTokens = Math.max(0, promptTokens - cacheReadInputTokens);
        const quotaDeductionTokens = uncachedPromptTokens + completionTokens;
        const durationMs = Date.now() - startTime;
        const logId = crypto.randomUUID();

        if (quotaDeductionTokens > 0) {
          await keyService.addQuotaUsed(keyRecord.id, quotaDeductionTokens);
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
            cacheReadInputTokens,
            cacheCreationInputTokens,
            durationMs,
            candidateName: keyRecord.candidate_name,
            debugTrace,
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
        let cacheReadInputTokens = 0;
        let cacheCreationInputTokens = 0;
        let responseContent = '';

        try {
          const resText = await responseClone.text();
          responseContent = resText;

          const resJson = JSON.parse(resText);
          if (debugTrace) {
            debugTrace.non_streaming_response_body = resJson;
          }
          const usageObj = resJson.usage || resJson.response?.usage;
          if (usageObj) {
            promptTokens = usageObj.prompt_tokens ?? usageObj.input_tokens ?? 0;
            completionTokens = usageObj.completion_tokens ?? usageObj.output_tokens ?? 0;
            cacheReadInputTokens =
              usageObj.prompt_tokens_details?.cached_tokens ??
              usageObj.input_tokens_details?.cached_tokens ??
              usageObj.cache_read_input_tokens ??
              0;
            cacheCreationInputTokens = usageObj.cache_creation_input_tokens ?? 0;
          }
        } catch {
          // Ignore parsing errors
        }

        const uncachedPromptTokens = Math.max(0, promptTokens - cacheReadInputTokens);
        const quotaDeductionTokens = uncachedPromptTokens + completionTokens;
        const durationMs = Date.now() - startTime;
        const logId = crypto.randomUUID();

        if (quotaDeductionTokens > 0) {
          await keyService.addQuotaUsed(keyRecord.id, quotaDeductionTokens);
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
            cacheReadInputTokens,
            cacheCreationInputTokens,
            durationMs,
            candidateName: keyRecord.candidate_name,
            debugTrace,
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
