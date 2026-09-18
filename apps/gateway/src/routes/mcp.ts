import { Hono } from 'hono';
import type { Context } from 'hono';
import type { InterviewKey, RequestLog } from '@oklychee/prism-shared';
import { GatewayContext } from '../types';
import { KeyService } from '../services/key.service';
import { AuditLogService } from '../services/audit.service';
import { SettingsService } from '../services/settings.service';
import { sha256Base64Url } from '../services/auth.service';
import { getDb } from '../db';

/**
 * MCP (Model Context Protocol) server over Streamable HTTP, stateless JSON response mode.
 * Auth: `Authorization: Bearer <mcp_api_key>` where the key is configured in global settings.
 */

const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0];
const SERVER_INFO = { name: 'prism-interview', version: '1.0.0' };

const DEFAULT_MAX_FIELD_CHARS = 8000;

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: JsonRpcId;
  method: string;
  params?: any;
}

class McpError extends Error {
  constructor(public code: number, message: string) {
    super(message);
  }
}

const TOOLS = [
  {
    name: 'list_interviews',
    title: 'List interview records',
    description:
      'List candidate interview records (one per candidate API key), newest first, with status, quota usage and request activity. Use the returned `id` with get_interview_trajectory.',
    inputSchema: {
      type: 'object',
      properties: {
        candidate_name: {
          type: 'string',
          description: 'Case-insensitive substring filter on candidate name.',
        },
        status: {
          type: 'string',
          enum: ['active', 'revoked', 'expired', 'exhausted'],
          description: 'Filter by effective status.',
        },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
        offset: { type: 'integer', minimum: 0, default: 0 },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'get_interview_trajectory',
    title: 'Get interview trajectory',
    description:
      "Get the chronological trajectory of one interview: every LLM request the candidate made (prompt, model response, model, tokens, latency). Paginate with offset/limit until has_more is false.",
    inputSchema: {
      type: 'object',
      properties: {
        interview_id: {
          type: 'string',
          description: 'Interview record id (the `id` returned by list_interviews).',
        },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        offset: { type: 'integer', minimum: 0, default: 0 },
        order: {
          type: 'string',
          enum: ['asc', 'desc'],
          default: 'asc',
          description: 'asc = oldest first (natural reading order).',
        },
        direct_prompts_only: {
          type: 'boolean',
          default: false,
          description:
            'Only include steps where the candidate typed a new prompt, skipping repeated agent-loop turns.',
        },
        include_system_prompt: { type: 'boolean', default: false },
        include_full_payload: {
          type: 'boolean',
          default: false,
          description: 'Include the raw request body sent by the client (can be very large).',
        },
        max_field_chars: {
          type: 'integer',
          minimum: 0,
          default: DEFAULT_MAX_FIELD_CHARS,
          description: 'Truncate each text field to this many characters; 0 disables truncation.',
        },
      },
      required: ['interview_id'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
  },
];

function effectiveStatus(key: InterviewKey): InterviewKey['status'] {
  if (key.status === 'revoked') return 'revoked';
  if (key.expires_at > 0 && Date.now() > key.expires_at) return 'expired';
  if (key.quota_used >= key.quota_limit) return 'exhausted';
  return key.status;
}

function toIso(ts: number | null | undefined): string | null {
  return ts ? new Date(ts).toISOString() : null;
}

function truncate(text: string | undefined, maxChars: number): string | undefined {
  if (text === undefined || maxChars <= 0 || text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n…[truncated ${text.length - maxChars} chars]`;
}

function intArg(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? parseInt(value, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function summarizeKey(key: InterviewKey) {
  return {
    id: key.id,
    candidate_name: key.candidate_name,
    status: effectiveStatus(key),
    quota_type: key.quota_type,
    quota_limit: key.quota_limit,
    quota_used: key.quota_used,
    allowed_models: key.allowed_models,
    created_at: toIso(key.created_at),
    expires_at: toIso(key.expires_at),
  };
}

async function listInterviews(c: Context<GatewayContext>, args: any) {
  const db = getDb(c.env.DB);
  const [keys, stats] = await Promise.all([new KeyService(db).listKeys(), new AuditLogService(db).getStatsByKey()]);

  const nameFilter = typeof args.candidate_name === 'string' ? args.candidate_name.trim().toLowerCase() : '';
  const statusFilter = typeof args.status === 'string' ? args.status : '';
  const limit = intArg(args.limit, 50, 1, 200);
  const offset = intArg(args.offset, 0, 0, Number.MAX_SAFE_INTEGER);

  const filtered = keys.filter(
    (k) =>
      (!nameFilter || k.candidate_name.toLowerCase().includes(nameFilter)) &&
      (!statusFilter || effectiveStatus(k) === statusFilter)
  );
  const page = filtered.slice(offset, offset + limit);

  return {
    total: filtered.length,
    offset,
    has_more: offset + page.length < filtered.length,
    interviews: page.map((k) => {
      const s = stats[k.id];
      return {
        ...summarizeKey(k),
        request_count: s?.request_count || 0,
        last_request_at: toIso(s?.last_request_at),
        prompt_tokens: s?.prompt_tokens || 0,
        completion_tokens: s?.completion_tokens || 0,
      };
    }),
  };
}

async function getInterviewTrajectory(c: Context<GatewayContext>, args: any) {
  const interviewId = typeof args.interview_id === 'string' ? args.interview_id.trim() : '';
  if (!interviewId) throw new McpError(-32602, 'interview_id is required');

  const db = getDb(c.env.DB);
  const key = await new KeyService(db).getKeyById(interviewId);
  if (!key) throw new McpError(-32602, `Interview not found: ${interviewId}`);

  const limit = intArg(args.limit, 20, 1, 100);
  const offset = intArg(args.offset, 0, 0, Number.MAX_SAFE_INTEGER);
  const order = args.order === 'desc' ? 'desc' : 'asc';
  const maxChars = intArg(args.max_field_chars, DEFAULT_MAX_FIELD_CHARS, 0, Number.MAX_SAFE_INTEGER);
  const includeSystemPrompt = args.include_system_prompt === true;
  const includeFullPayload = args.include_full_payload === true;

  const auditService = new AuditLogService(db);
  // Fetch one extra row to detect whether another page exists
  const rows = await auditService.listLogs(interviewId, limit + 1, offset, order, args.direct_prompts_only === true);
  const hasMore = rows.length > limit;
  const logs = rows.slice(0, limit);

  // Heavy fields may live in R2; resolve them concurrently for this page
  const contents = await Promise.all(
    logs.map((log: RequestLog) =>
      log.r2_log_key ? auditService.loadLogContent(log, c.env.LOG_BUCKET) : Promise.resolve(log)
    )
  );

  return {
    interview: summarizeKey(key),
    offset,
    order,
    has_more: hasMore,
    steps: logs.map((log, i) => ({
      step: order === 'asc' ? offset + i + 1 : undefined,
      id: log.id,
      created_at: toIso(log.created_at),
      protocol: log.protocol,
      model: log.model,
      is_direct_prompt: log.user_prompt_count > 0 && !log.is_repeated_loop,
      is_repeated_loop: Boolean(log.is_repeated_loop),
      user_prompt: truncate(log.user_prompt, maxChars),
      system_prompt: includeSystemPrompt ? truncate(log.system_prompt, maxChars) : undefined,
      response_content: truncate(contents[i].response_content, maxChars),
      full_payload: includeFullPayload ? truncate(contents[i].full_payload, maxChars) : undefined,
      prompt_tokens: log.prompt_tokens,
      completion_tokens: log.completion_tokens,
      cache_read_input_tokens: log.cache_read_input_tokens || 0,
      cache_creation_input_tokens: log.cache_creation_input_tokens || 0,
      duration_ms: log.duration_ms,
    })),
  };
}

async function callTool(c: Context<GatewayContext>, params: any) {
  const name = params?.name;
  const args = params?.arguments && typeof params.arguments === 'object' ? params.arguments : {};

  let result: unknown;
  switch (name) {
    case 'list_interviews':
      result = await listInterviews(c, args);
      break;
    case 'get_interview_trajectory':
      result = await getInterviewTrajectory(c, args);
      break;
    default:
      throw new McpError(-32602, `Unknown tool: ${name}`);
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    isError: false,
  };
}

async function dispatch(c: Context<GatewayContext>, req: JsonRpcRequest): Promise<unknown> {
  switch (req.method) {
    case 'initialize': {
      const requested = req.params?.protocolVersion;
      return {
        protocolVersion: SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : LATEST_PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          'Prism interview review server. Call list_interviews to find a candidate, then get_interview_trajectory with its id to read the prompts they sent and the model responses in order.',
      };
    }
    case 'ping':
      return {};
    case 'tools/list':
      return { tools: TOOLS };
    case 'tools/call':
      return callTool(c, req.params);
    default:
      throw new McpError(-32601, `Method not found: ${req.method}`);
  }
}

async function handleMessage(c: Context<GatewayContext>, msg: any): Promise<object | null> {
  if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    // Responses from the client (e.g. to server requests) are ignored; malformed requests get an error
    if (msg && typeof msg === 'object' && ('result' in msg || 'error' in msg)) return null;
    return { jsonrpc: '2.0', id: msg?.id ?? null, error: { code: -32600, message: 'Invalid Request' } };
  }

  const isNotification = msg.id === undefined || msg.id === null;
  try {
    const result = await dispatch(c, msg);
    return isNotification ? null : { jsonrpc: '2.0', id: msg.id, result };
  } catch (err: any) {
    if (isNotification) return null;
    if (err instanceof McpError) {
      return { jsonrpc: '2.0', id: msg.id, error: { code: err.code, message: err.message } };
    }
    console.error('MCP request failed:', err);
    return { jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: err?.message || 'Internal error' } };
  }
}

/**
 * Constant-time key comparison (hash both sides so lengths never leak).
 */
async function isValidMcpKey(provided: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256Base64Url(provided), sha256Base64Url(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const mcp = new Hono<GatewayContext>();

// Auth: Bearer key configured in global settings (`mcp_api_key`). No key configured => MCP disabled.
mcp.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';

  const expected = (await new SettingsService(getDb(c.env.DB)).getSetting('mcp_api_key'))?.trim();
  if (!expected) {
    return c.json({ error: 'MCP is disabled: no MCP API key configured in global settings' }, 403);
  }
  if (!token || !(await isValidMcpKey(token, expected))) {
    c.header('WWW-Authenticate', 'Bearer realm="prism-mcp"');
    return c.json({ error: 'Unauthorized: Invalid or missing MCP API key' }, 401);
  }

  await next();
});

mcp.post('/', async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400);
  }

  if (Array.isArray(body)) {
    const responses = (await Promise.all(body.map((msg) => handleMessage(c, msg)))).filter(Boolean);
    return responses.length > 0 ? c.json(responses) : c.body(null, 202);
  }

  const response = await handleMessage(c, body);
  return response ? c.json(response) : c.body(null, 202);
});

// Stateless server: no server-initiated SSE stream and no sessions to terminate
mcp.on(['GET', 'DELETE'], '/', (c) => {
  c.header('Allow', 'POST');
  return c.json({ error: 'Method Not Allowed' }, 405);
});

export default mcp;
