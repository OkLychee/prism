import { ProviderHandler, ProviderHandlerParams, ProviderHandlerResult, buildCfGatewayUrl, buildCfHeaders } from './base';

export const CUSTOM_AIG_PROVIDER_PREFIX = 'custom-';
export const CUSTOM_AIG_PROVIDER_PATTERN = /^custom-[a-z0-9_-]+$/;

export function isCustomAigProvider(slug?: string | null): boolean {
  return Boolean(slug && slug.toLowerCase().startsWith(CUSTOM_AIG_PROVIDER_PREFIX));
}

/**
 * Cloudflare AI Gateway Custom Provider (slug must start with 'custom-').
 * Format: https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/custom-{name}/{path}
 */
export class CustomAigProviderHandler implements ProviderHandler {
  name = 'Custom Provider';

  constructor(public slug: string) {}

  buildRequest(params: ProviderHandlerParams): ProviderHandlerResult {
    const targetUrl = buildCfGatewayUrl(params.cfAccountId, params.cfGatewayId, this.slug, params.effectiveUpstreamPath);
    if (params.apiProtocol === 'anthropic') {
      const headers = buildCfHeaders(params.cfApiToken, params.upstreamApiKey, 'x-api-key', '');
      headers['anthropic-version'] = params.incomingHeaders?.get('anthropic-version') || '2023-06-01';
      return { targetUrl, headers };
    }
    const headers = buildCfHeaders(params.cfApiToken, params.upstreamApiKey, 'Authorization', 'Bearer ');
    return { targetUrl, headers };
  }
}
