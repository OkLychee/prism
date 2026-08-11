import { Hono } from 'hono';
import { GatewayContext } from '../types';
import { KeyService } from '../services/key.service';
import { proxyAndAuditRequest } from '../proxy';
import { getDb } from '../db';

export function createProtocolRouter(protocol: 'openai' | 'anthropic') {
  const router = new Hono<GatewayContext>();

  router.use('*', async (c, next) => {
    // Extract API Key
    const authHeader = c.req.header('Authorization');
    const xApiKey = c.req.header('x-api-key');
    let apiKey = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7);
    } else if (xApiKey) {
      apiKey = xApiKey;
    }

    if (!apiKey) {
      return formatErrorResponse(protocol, 401, 'Missing API Key in Authorization or x-api-key header');
    }

    // Validate Key against D1 Database via KeyService
    const keyService = new KeyService(getDb(c.env.DB));
    const keyRecord = await keyService.findActiveByKeyHash(apiKey);

    if (!keyRecord) {
      return formatErrorResponse(protocol, 401, 'Invalid or inactive API Key');
    }

    // Check expiration
    if (keyRecord.expires_at > 0 && Date.now() > keyRecord.expires_at) {
      return formatErrorResponse(protocol, 403, 'API Key has expired');
    }

    // Check Quota Limit
    if (keyRecord.quota_used >= keyRecord.quota_limit) {
      return formatErrorResponse(protocol, 429, 'Token or Budget Quota Exceeded for this interview key');
    }

    c.set('keyRecord', keyRecord);
    await next();
  });

  // GET /v1/models (Models probe)
  router.get('/v1/models', async (c) => {
    const keyRecord = c.get('keyRecord');
    const allowedModelsRaw: string[] = JSON.parse(keyRecord.allowed_models || '[]');

    // Strip composite "upstream_id::model_name" prefix for downstream candidates, and de-duplicate
    const cleanModelsSet = new Set<string>();
    for (const item of allowedModelsRaw) {
      const cleanName = item.includes('::') ? item.split('::')[1] : item;
      if (cleanName) cleanModelsSet.add(cleanName);
    }
    const cleanModelsList = Array.from(cleanModelsSet);

    const modelsData = cleanModelsList.map((m) => ({
      id: m,
      object: 'model',
      created: 1700000000,
      owned_by: 'prism-gateway',
    }));

    if (protocol === 'openai') {
      return c.json({ object: 'list', data: modelsData });
    } else {
      return c.json({ data: modelsData });
    }
  });

  // Fallback Catch-all for API completions / messages proxy
  router.all('*', async (c) => {
    const keyRecord = c.get('keyRecord');
    const url = new URL(c.req.url);
    const upstreamPath = url.pathname.replace(`/${protocol}`, '');

    let bodyJson: any = {};
    try {
      bodyJson = await c.req.json();
    } catch {
      // Body might be empty
    }

    // Auto-inject stream_options for OpenAI protocol to ensure upstream returns token usage in SSE chunks
    if (protocol === 'openai' && bodyJson.stream) {
      bodyJson.stream_options = { include_usage: true, ...bodyJson.stream_options };
    }

    const modelName = bodyJson.model || 'default';
    const allowedModelsRaw: string[] = JSON.parse(keyRecord.allowed_models || '[]');

    const cleanAllowedModels = allowedModelsRaw.map((m) => (m.includes('::') ? m.split('::')[1] : m));

    if (cleanAllowedModels.length > 0 && !cleanAllowedModels.includes(modelName)) {
      return formatErrorResponse(
        protocol,
        403,
        `Model '${modelName}' is not allowed for this key. Allowed models: ${Array.from(new Set(cleanAllowedModels)).join(', ')}`
      );
    }

    return proxyAndAuditRequest(c.req.raw, c.env, c.executionCtx as unknown as ExecutionContext, {
      protocol,
      upstreamPath,
      keyRecord,
      bodyJson,
    });
  });

  return router;
}

function formatErrorResponse(protocol: 'openai' | 'anthropic', status: number, message: string): Response {
  const headers = { 'Content-Type': 'application/json' };
  if (protocol === 'openai') {
    return new Response(
      JSON.stringify({
        error: {
          message,
          type: status === 429 ? 'quota_exceeded' : 'invalid_request_error',
          code: status,
        },
      }),
      { status, headers }
    );
  } else {
    return new Response(
      JSON.stringify({
        type: 'error',
        error: {
          type: status === 429 ? 'rate_limit_error' : 'authentication_error',
          message,
        },
      }),
      { status, headers }
    );
  }
}
