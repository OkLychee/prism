import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Upstream configurations (OpenAI, Anthropic, Workers AI, Custom BYOK)
export const upstreamConfigs = sqliteTable('upstream_configs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  provider_type: text('provider_type').notNull(), // 'cf_workers_ai' | 'cf_ai_gateway' | 'custom'
  cf_aig_provider: text('cf_aig_provider'), // 'openai' | 'anthropic' | 'google-ai-studio' | 'grok' | 'openrouter'
  api_protocol: text('api_protocol').notNull().default('openai'), // 'openai' | 'anthropic'
  base_url: text('base_url').notNull(),
  api_key: text('api_key').notNull(),
  available_models: text('available_models').notNull().default('[]'), // JSON Array
  created_at: integer('created_at').notNull(),
});

// Candidate Interview API Keys & Quotas
export const interviewKeys = sqliteTable('interview_keys', {
  id: text('id').primaryKey(),
  key_hash: text('key_hash').notNull().unique(), // Bearer token / API Key hash
  candidate_name: text('candidate_name').notNull(),
  quota_type: text('quota_type').notNull(), // 'tokens' | 'usd'
  quota_limit: real('quota_limit').notNull(),
  quota_used: real('quota_used').notNull().default(0),
  allowed_models: text('allowed_models').notNull().default('[]'), // JSON Array
  expires_at: integer('expires_at').notNull(),
  timezone: text('timezone').default('UTC'), // Saved timezone, e.g. 'UTC' or 'Asia/Shanghai'
  status: text('status').notNull().default('active'), // 'active' | 'expired' | 'exhausted' | 'revoked'
  created_at: integer('created_at').notNull(),
});

// Request Logs & Prompt Trace Timeline
export const requestLogs = sqliteTable('request_logs', {
  id: text('id').primaryKey(),
  key_id: text('key_id').notNull().references(() => interviewKeys.id),
  protocol: text('protocol').notNull(), // 'openai' | 'anthropic'
  model: text('model').notNull(),
  user_prompt_count: integer('user_prompt_count').notNull().default(0),
  system_prompt: text('system_prompt'),
  user_prompt: text('user_prompt'),
  full_payload: text('full_payload'),
  response_content: text('response_content'),
  r2_log_key: text('r2_log_key'),
  prompt_tokens: integer('prompt_tokens').notNull().default(0),
  completion_tokens: integer('completion_tokens').notNull().default(0),
  cost_usd: real('cost_usd').notNull().default(0),
  duration_ms: integer('duration_ms').notNull().default(0),
  created_at: integer('created_at').notNull(),
});

// Global System Settings (Cloudflare Account ID, AI Gateway Slug, etc.)
export const systemSettings = sqliteTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updated_at: integer('updated_at').notNull(),
});

// Dashboard Admin Session Tokens
export const adminTokens = sqliteTable('admin_tokens', {
  id: text('id').primaryKey(),
  secret_hash: text('secret_hash').notNull(),
  expires_at: integer('expires_at').notNull(),
  created_at: integer('created_at').notNull(),
});

export type UpstreamConfigSelect = typeof upstreamConfigs.$inferSelect;
export type InterviewKeySelect = typeof interviewKeys.$inferSelect;
export type RequestLogSelect = typeof requestLogs.$inferSelect;
export type SystemSettingSelect = typeof systemSettings.$inferSelect;
export type AdminTokenSelect = typeof adminTokens.$inferSelect;

