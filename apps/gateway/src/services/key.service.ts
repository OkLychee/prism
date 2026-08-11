import { eq, sql, desc } from 'drizzle-orm';
import type { InterviewKey } from '@oklychee/prism-shared';
import { Database } from '../db';
import { interviewKeys } from '../db/schema';

export class KeyService {
  constructor(private db: Database) {}

  async listKeys(): Promise<InterviewKey[]> {
    const results = await this.db
      .select()
      .from(interviewKeys)
      .orderBy(desc(interviewKeys.created_at));

    return results.map((r) => ({
      ...r,
      quota_type: r.quota_type as 'tokens' | 'usd',
      status: r.status as 'active' | 'expired' | 'exhausted' | 'revoked',
      timezone: r.timezone || 'UTC',
      allowed_models: JSON.parse(r.allowed_models || '[]'),
    }));
  }

  async createKey(data: {
    candidate_name?: string;
    quota_type?: 'tokens' | 'usd';
    quota_limit?: number;
    allowed_models?: string[];
    expires_at?: number;
    timezone?: string;
    key_hash?: string;
  }) {
    const id = `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Generate secure random long key string on backend (e.g. sk-interview-64chars)
    let keyHash = data.key_hash;
    if (!keyHash) {
      const randomArray = new Uint8Array(24);
      crypto.getRandomValues(randomArray);
      const hexString = Array.from(randomArray, (b) => b.toString(16).padStart(2, '0')).join('');
      keyHash = `sk-interview-${hexString}`;
    }

    const candidateName = data.candidate_name || 'Anonymous Candidate';
    const quotaType = data.quota_type || 'tokens';
    const quotaLimit = Number(data.quota_limit) || 1000000;
    const allowedModels = JSON.stringify(data.allowed_models || []);
    const expiresAt = data.expires_at || Date.now() + 7 * 24 * 60 * 60 * 1000;
    const timezone = data.timezone || 'UTC';
    const createdAt = Date.now();

    await this.db.insert(interviewKeys).values({
      id,
      key_hash: keyHash,
      candidate_name: candidateName,
      quota_type: quotaType,
      quota_limit: quotaLimit,
      quota_used: 0,
      allowed_models: allowedModels,
      expires_at: expiresAt,
      timezone: timezone,
      status: 'active',
      created_at: createdAt,
    });

    return {
      id,
      key_hash: keyHash,
      candidate_name: candidateName,
      quota_type: quotaType,
      quota_limit: quotaLimit,
      quota_used: 0,
      allowed_models: data.allowed_models || [],
      expires_at: expiresAt,
      timezone: timezone,
      status: 'active' as const,
      created_at: createdAt,
    };
  }

  async findActiveByKeyHash(keyHash: string) {
    const [result] = await this.db
      .select()
      .from(interviewKeys)
      .where(
        sql`${interviewKeys.key_hash} = ${keyHash} AND ${interviewKeys.status} = 'active'`
      )
      .limit(1);

    return result || null;
  }

  async addQuotaUsed(id: string, tokens: number) {
    await this.db
      .update(interviewKeys)
      .set({
        quota_used: sql`${interviewKeys.quota_used} + ${tokens}`,
      })
      .where(eq(interviewKeys.id, id));
  }

  async updateKeyStatus(id: string, status: 'active' | 'revoked') {
    await this.db
      .update(interviewKeys)
      .set({ status })
      .where(eq(interviewKeys.id, id));
  }

  async updateKey(
    id: string,
    data: {
      candidate_name?: string;
      quota_type?: 'tokens' | 'usd';
      quota_limit?: number;
      allowed_models?: string[];
      expires_at?: number;
      timezone?: string;
    }
  ) {
    const updatePayload: Record<string, any> = {};
    if (data.candidate_name !== undefined) updatePayload.candidate_name = data.candidate_name;
    if (data.quota_type !== undefined) updatePayload.quota_type = data.quota_type;
    if (data.quota_limit !== undefined) updatePayload.quota_limit = Number(data.quota_limit);
    if (data.allowed_models !== undefined) updatePayload.allowed_models = JSON.stringify(data.allowed_models);
    if (data.expires_at !== undefined) updatePayload.expires_at = Number(data.expires_at);
    if (data.timezone !== undefined) updatePayload.timezone = data.timezone;

    await this.db
      .update(interviewKeys)
      .set(updatePayload)
      .where(eq(interviewKeys.id, id));

    return { id, ...data };
  }

  async deleteKey(id: string) {
    await this.db
      .delete(interviewKeys)
      .where(eq(interviewKeys.id, id));
  }
}
