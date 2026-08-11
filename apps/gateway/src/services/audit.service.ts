import { eq, desc } from 'drizzle-orm';
import type { RequestLog } from '@oklychee/prism-shared';
import { Database } from '../db';
import { requestLogs } from '../db/schema';
import { parsePromptPayload } from '../parser';

export class AuditLogService {
  constructor(private db: Database) {}

  async listLogs(keyId?: string | null, limit: number = 50, offset: number = 0): Promise<RequestLog[]> {
    const pageLimit = Math.max(1, Math.min(limit, 100));
    const pageOffset = Math.max(0, offset);

    let logs;
    if (keyId) {
      logs = await this.db
        .select()
        .from(requestLogs)
        .where(eq(requestLogs.key_id, keyId))
        .orderBy(desc(requestLogs.created_at))
        .limit(pageLimit)
        .offset(pageOffset);
    } else {
      logs = await this.db
        .select()
        .from(requestLogs)
        .orderBy(desc(requestLogs.created_at))
        .limit(pageLimit)
        .offset(pageOffset);
    }

    return logs.map((l) => ({
      ...l,
      protocol: l.protocol as RequestLog['protocol'],
      system_prompt: l.system_prompt || undefined,
      user_prompt: l.user_prompt || undefined,
      full_payload: l.full_payload || undefined,
      response_content: l.response_content || undefined,
      r2_log_key: l.r2_log_key || undefined,
    }));
  }

  async getLogById(id: string): Promise<RequestLog | null> {
    const [result] = await this.db
      .select()
      .from(requestLogs)
      .where(eq(requestLogs.id, id))
      .limit(1);

    if (!result) return null;
    return {
      ...result,
      protocol: result.protocol as RequestLog['protocol'],
      system_prompt: result.system_prompt || undefined,
      user_prompt: result.user_prompt || undefined,
      full_payload: result.full_payload || undefined,
      response_content: result.response_content || undefined,
      r2_log_key: result.r2_log_key || undefined,
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
      durationMs: number;
      candidateName?: string;
    },
    storageEngine: 'd1' | 'r2' = 'd1',
    r2Bucket?: R2Bucket
  ) {
    const parsedPrompt = parsePromptPayload(data.protocol, data.bodyJson);
    const createdAt = Date.now();
    let r2LogKey: string | undefined;

    let fullPayloadToSave: string | undefined = JSON.stringify(data.bodyJson);
    let responseContentToSave: string | undefined = data.responseContent;

    // Dispatch to R2 if storageEngine is 'r2' and LOG_BUCKET is available
    if (storageEngine === 'r2' && r2Bucket) {
      try {
        const dateISO = new Date(createdAt).toISOString().split('T')[0]; // e.g. 2026-08-11
        const sanitizeName = (data.candidateName || 'candidate').replace(/[^a-zA-Z0-9_\-]/g, '_');
        r2LogKey = `logs/${dateISO}/${data.keyId}-${sanitizeName}-${createdAt}-${data.logId.substring(0, 8)}.json`;

        const logPayloadObject = {
          log_id: data.logId,
          key_id: data.keyId,
          candidate_name: data.candidateName,
          protocol: data.protocol,
          model: data.modelName,
          prompt_tokens: data.promptTokens,
          completion_tokens: data.completionTokens,
          duration_ms: data.durationMs,
          created_at: createdAt,
          full_payload: data.bodyJson,
          response_content: data.responseContent,
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
      full_payload: fullPayloadToSave,
      response_content: responseContentToSave,
      r2_log_key: r2LogKey,
      prompt_tokens: data.promptTokens,
      completion_tokens: data.completionTokens,
      cost_usd: 0,
      duration_ms: data.durationMs,
      created_at: createdAt,
    });
  }
}
