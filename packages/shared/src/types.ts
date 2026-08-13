export interface UpstreamConfig {
  id: string;
  name: string;
  provider_type: 'cf_workers_ai' | 'cf_ai_gateway' | 'custom';
  cf_aig_provider?: string; // 'openai' | 'anthropic' | 'google-ai-studio' | 'grok' | 'openrouter'
  api_protocol: 'openai' | 'anthropic';
  base_url: string;
  api_key: string;
  api_key_configured?: boolean; // Indicates if API Key is set without exposing secret
  available_models: string[]; // JSON Array
  created_at: number;
}

export interface InterviewKey {
  id: string;
  key_hash: string;
  candidate_name: string;
  quota_type: 'tokens' | 'usd';
  quota_limit: number;
  quota_used: number;
  allowed_models: string[]; // JSON Array
  expires_at: number;
  timezone?: string; // e.g. 'UTC' or 'Asia/Shanghai'
  status: 'active' | 'expired' | 'exhausted' | 'revoked';
  created_at: number;
}

export interface RequestLog {
  id: string;
  key_id: string;
  protocol: 'openai' | 'anthropic';
  model: string;
  user_prompt_count: number;
  system_prompt?: string;
  user_prompt?: string;
  user_prompt_hash?: string;
  full_payload?: string;
  response_content?: string;
  r2_log_key?: string;
  is_repeated_loop?: number;
  prompt_tokens: number;
  completion_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  cost_usd: number;
  duration_ms: number;
  created_at: number;
}

export interface SystemSetting {
  key: string;
  value: string;
  updated_at: number;
}

export interface SystemSettingsResponse {
  cf_account_id?: string;
  cf_gateway_id?: string;
  cf_api_token_configured?: boolean; // Indicates if token is set in backend without exposing raw secret
  admin_username?: string;
  timezone_mode?: 'UTC' | 'system';
  log_storage_engine?: 'd1' | 'r2';
}

export interface SystemSettingsPayload {
  cf_account_id?: string;
  cf_gateway_id?: string;
  cf_api_token?: string; // Send new token or empty to clear/keep
  admin_username?: string;
  admin_password?: string;
  old_admin_password?: string;
  timezone_mode?: 'UTC' | 'system';
  log_storage_engine?: 'd1' | 'r2';
}

export interface LoginPayload {
  username: string;
  password?: string;
  turnstile_token?: string;
}

export interface LoginResponse {
  token: string;
  expires_at: number;
  must_change_password?: boolean;
}

export interface AuthCheckResponse {
  authenticated: boolean;
  must_change_password?: boolean;
}



