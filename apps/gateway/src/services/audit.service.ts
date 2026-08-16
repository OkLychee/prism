import { eq, desc, asc } from 'drizzle-orm';
import type { RequestLog } from '@oklychee/prism-shared';
import { Database } from '../db';
import { requestLogs } from '../db/schema';
import { parsePromptPayload } from '../parser';

export class AuditLogService {
  constructor(private db: Database) {}

  async listLogs(
    keyId?: string | null,
    limit: number = 50,
    offset: number = 0,
    order: 'asc' | 'desc' = 'desc'
  ): Promise<RequestLog[]> {
    const pageLimit = Math.max(1, Math.min(limit, 100));
    const pageOffset = Math.max(0, offset);
    const orderDirection = order === 'asc' ? asc(requestLogs.created_at) : desc(requestLogs.created_at);

    let logs;
    if (keyId) {
      logs = await this.db
        .select()
        .from(requestLogs)
        .where(eq(requestLogs.key_id, keyId))
        .orderBy(orderDirection)
        .limit(pageLimit)
        .offset(pageOffset);
    } else {
      logs = await this.db
        .select()
        .from(requestLogs)
        .orderBy(orderDirection)
        .limit(pageLimit)
        .offset(pageOffset);
    }

    return logs.map((l) => ({
      ...l,
      protocol: l.protocol as RequestLog['protocol'],
      system_prompt: l.system_prompt || undefined,
      user_prompt: l.user_prompt || undefined,
      user_prompt_hash: l.user_prompt_hash || undefined,
      full_payload: l.full_payload || undefined,
      response_content: l.response_content || undefined,
      r2_log_key: l.r2_log_key || undefined,
      is_repeated_loop: l.is_repeated_loop || 0,
      prompt_tokens: l.prompt_tokens,
      completion_tokens: l.completion_tokens,
      cache_read_input_tokens: l.cache_read_input_tokens || 0,
      cache_creation_input_tokens: l.cache_creation_input_tokens || 0,
      cost_usd: l.cost_usd,
      duration_ms: l.duration_ms,
      created_at: l.created_at,
    }));
  }

  async getLogById(id: string): Promise<RequestLog | null> {
    const results = await this.db.select().from(requestLogs).where(eq(requestLogs.id, id)).limit(1);
    if (results.length === 0) return null;
    const result = results[0];
    return {
      ...result,
      protocol: result.protocol as RequestLog['protocol'],
      system_prompt: result.system_prompt || undefined,
      user_prompt: result.user_prompt || undefined,
      user_prompt_hash: result.user_prompt_hash || undefined,
      full_payload: result.full_payload || undefined,
      response_content: result.response_content || undefined,
      r2_log_key: result.r2_log_key || undefined,
      is_repeated_loop: result.is_repeated_loop || 0,
      cache_read_input_tokens: result.cache_read_input_tokens || 0,
      cache_creation_input_tokens: result.cache_creation_input_tokens || 0,
    };
  }

  async recordLog(
    data: {
      logId: string;
      keyId: string;
      protocol: 'openai' | 'anthropic';
      modelName: string;
      bodyJson: any;
      responseContent: string;
      promptTokens: number;
      completionTokens: number;
      cacheReadInputTokens?: number;
      cacheCreationInputTokens?: number;
      durationMs: number;
      candidateName?: string;
      debugTrace?: any;
    },
    storageEngine: 'd1' | 'r2' = 'd1',
    r2Bucket?: R2Bucket
  ) {
    const parsedPrompt = parsePromptPayload(data.protocol, data.bodyJson);
    const createdAt = Date.now();

    // Check for repeated user prompt loop by querying the last record's hash for this key_id
    let isRepeatedLoop = 0;
    try {
      const lastLogRecord = await this.db
        .select({ user_prompt_hash: requestLogs.user_prompt_hash })
        .from(requestLogs)
        .where(eq(requestLogs.key_id, data.keyId))
        .orderBy(desc(requestLogs.created_at))
        .limit(1);

      if (
        lastLogRecord.length > 0 &&
        parsedPrompt.userPromptHash &&
        lastLogRecord[0].user_prompt_hash === parsedPrompt.userPromptHash
      ) {
        isRepeatedLoop = 1;
      }
    } catch {
      // Ignore query error if DB state is transient
    }

    let r2LogKey: string | undefined;

    let fullPayloadToSave: string | undefined = JSON.stringify(data.bodyJson);
    let responseContentToSave: string | undefined = data.responseContent;

    // Save DEBUG trace log file to R2 if debugTrace is supplied
    if (r2Bucket && data.debugTrace) {
      try {
        const dateISO = new Date(createdAt).toISOString().split('T')[0];
        const debugR2Key = `debug_logs/${dateISO}/${data.keyId}-${createdAt}-${data.logId.substring(0, 8)}-debug.json`;
        await r2Bucket.put(debugR2Key, JSON.stringify(data.debugTrace, null, 2), {
          httpMetadata: { contentType: 'application/json' },
        });
      } catch (err) {
        console.error('Failed to write debug trace log to R2:', err);
      }
    }

    // Dispatch to R2 if storageEngine is 'r2' and LOG_BUCKET is available
    if (storageEngine === 'r2' && r2Bucket) {
      try {
        const dateISO = new Date(createdAt).toISOString().split('T')[0]; // e.g. 2026-08-11
        r2LogKey = `logs/${dateISO}/${data.keyId}-${createdAt}-${data.logId.substring(0, 8)}.json`;

        const logPayloadObject = {
          log_id: data.logId,
          key_id: data.keyId,
          candidate_name: data.candidateName,
          protocol: data.protocol,
          model: data.modelName,
          prompt_tokens: data.promptTokens,
          completion_tokens: data.completionTokens,
          cache_read_input_tokens: data.cacheReadInputTokens || 0,
          cache_creation_input_tokens: data.cacheCreationInputTokens || 0,
          duration_ms: data.durationMs,
          created_at: createdAt,
          full_payload: data.bodyJson,
          response_content: data.responseContent,
          user_prompt_hash: parsedPrompt.userPromptHash,
          is_repeated_loop: isRepeatedLoop,
        };

        await r2Bucket.put(r2LogKey, JSON.stringify(logPayloadObject, null, 2), {
          httpMetadata: { contentType: 'application/json' },
        });

        // Clear heavy payload from D1 when successfully written to R2
        fullPayloadToSave = undefined;
        responseContentToSave = undefined;
      } catch (err) {
        console.error('Failed to save log file to R2, falling back to D1:', err);
        r2LogKey = undefined;
        fullPayloadToSave = JSON.stringify(data.bodyJson);
        responseContentToSave = data.responseContent;
      }
    }

    await this.db.insert(requestLogs).values({
      id: data.logId,
      key_id: data.keyId,
      protocol: data.protocol,
      model: data.modelName || 'unknown',
      user_prompt_count: parsedPrompt.userPromptCount,
      system_prompt: parsedPrompt.systemPrompt,
      user_prompt: parsedPrompt.userPrompt,
      user_prompt_hash: parsedPrompt.userPromptHash,
      full_payload: fullPayloadToSave,
      response_content: responseContentToSave,
      r2_log_key: r2LogKey,
      is_repeated_loop: isRepeatedLoop,
      prompt_tokens: data.promptTokens,
      completion_tokens: data.completionTokens,
      cache_read_input_tokens: data.cacheReadInputTokens || 0,
      cache_creation_input_tokens: data.cacheCreationInputTokens || 0,
      cost_usd: 0,
      duration_ms: data.durationMs,
      created_at: createdAt,
    });
  }
}
