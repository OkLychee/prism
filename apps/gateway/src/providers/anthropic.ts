import { ProviderHandler, ProviderHandlerParams, ProviderHandlerResult, buildCfGatewayUrl, buildCfHeaders } from './base';

export class AnthropicProviderHandler implements ProviderHandler {
  slug = 'anthropic';
  name = 'Anthropic';

  buildRequest(params: ProviderHandlerParams): ProviderHandlerResult {
    const targetUrl = buildCfGatewayUrl(params.cfAccountId, params.cfGatewayId, 'anthropic', params.effectiveUpstreamPath);
    const headers = buildCfHeaders(params.cfApiToken, params.upstreamApiKey, 'x-api-key', '');
    
    // Prefer client's incoming anthropic-version header if present, fallback to '2023-06-01'
    const clientVersion = params.incomingHeaders?.get('anthropic-version');
    headers['anthropic-version'] = clientVersion || '2023-06-01';

    return { targetUrl, headers };
  }
}
