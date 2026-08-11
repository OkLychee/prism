export interface ProviderHandlerParams {
  cfAccountId: string;
  cfGatewayId: string;
  cfApiToken: string;
  upstreamApiKey: string;
  effectiveUpstreamPath: string;
  customBaseUrl?: string;
  incomingHeaders?: Headers;
}

export interface ProviderHandlerResult {
  targetUrl: string;
  headers: Record<string, string>;
}

export interface ProviderHandler {
  slug: string;
  name: string;
  buildRequest(params: ProviderHandlerParams): ProviderHandlerResult;
}

/**
 * Helper to normalize Cloudflare AI Gateway Base URLs.
 * Format: https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/{provider_slug}
 */
export function buildCfGatewayUrl(
  cfAccountId: string,
  cfGatewayId: string,
  providerSlug: string,
  upstreamPath: string
): string {
  const account = cfAccountId || '{account_id}';
  const gateway = cfGatewayId || 'default';
  const base = `https://gateway.ai.cloudflare.com/v1/${account}/${gateway}/${providerSlug}`;

  // Ensure single slash joining without stripping valid path segments
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = upstreamPath.startsWith('/') ? upstreamPath : `/${upstreamPath}`;

  return `${cleanBase}${cleanPath}`;
}

/**
 * Helper to build auth headers for Cloudflare AI Gateway + Provider API Keys.
 */
export function buildCfHeaders(
  cfApiToken: string,
  upstreamApiKey?: string,
  keyHeaderName = 'Authorization',
  keyHeaderPrefix = 'Bearer '
): Record<string, string> {
  const headers: Record<string, string> = {};

  // If Authenticated Gateway is enabled on CF AI Gateway
  if (cfApiToken) {
    headers['cf-aig-authorization'] = `Bearer ${cfApiToken}`;
  }

  // If client provided a specific provider API Key (BYOK with request)
  if (upstreamApiKey) {
    headers[keyHeaderName] = keyHeaderPrefix ? `${keyHeaderPrefix}${upstreamApiKey}` : upstreamApiKey;
  }

  return headers;
}
