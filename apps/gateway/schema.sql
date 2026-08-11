-- Upstream configurations (OpenAI, Anthropic, Workers AI, Custom BYOK)
CREATE TABLE IF NOT EXISTS upstream_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL, -- 'cf_workers_ai' | 'cf_ai_gateway' | 'custom'
    cf_aig_provider TEXT, -- 'openai' | 'anthropic' | 'google-ai-studio' | 'grok' | 'openrouter' (Required when provider_type='cf_ai_gateway')
    api_protocol TEXT NOT NULL DEFAULT 'openai', -- 'openai' | 'anthropic'
    base_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    available_models TEXT NOT NULL DEFAULT '[]', -- JSON Array
    created_at INTEGER NOT NULL
);

-- Candidate Interview API Keys & Quotas
CREATE TABLE IF NOT EXISTS interview_keys (
    id TEXT PRIMARY KEY,
    key_hash TEXT NOT NULL UNIQUE, -- Bearer token / API Key hash
    candidate_name TEXT NOT NULL,
    quota_type TEXT NOT NULL, -- 'tokens' | 'usd'
    quota_limit REAL NOT NULL,
    quota_used REAL NOT NULL DEFAULT 0,
    allowed_models TEXT NOT NULL DEFAULT '[]', -- JSON Array
    expires_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'expired' | 'exhausted' | 'revoked'
    created_at INTEGER NOT NULL
);

-- Request Logs & Prompt Trace Timeline
CREATE TABLE IF NOT EXISTS request_logs (
    id TEXT PRIMARY KEY,
    key_id TEXT NOT NULL,
    protocol TEXT NOT NULL, -- 'openai' | 'anthropic'
    model TEXT NOT NULL,
    user_prompt_count INTEGER NOT NULL DEFAULT 0,
    system_prompt TEXT,
    user_prompt TEXT,
    full_payload TEXT NOT NULL,
    response_content TEXT,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd REAL NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(key_id) REFERENCES interview_keys(id)
);
-- Global System Settings (Cloudflare Account ID, AI Gateway Slug, Admin Credentials, etc.)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Dashboard Admin Session Tokens
CREATE TABLE IF NOT EXISTS admin_tokens (
    id TEXT PRIMARY KEY, -- String representation of 64-bit uint64 Token ID (to avoid SQLite integer precision loss)
    secret_hash TEXT NOT NULL, -- SHA256 base64url hash of secret part
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

