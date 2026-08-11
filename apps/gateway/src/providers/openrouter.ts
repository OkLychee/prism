import { ProviderHandler, ProviderHandlerParams, ProviderHandlerResult, buildCfGatewayUrl, buildCfHeaders } from './base';

export class OpenRouterProviderHandler implements ProviderHandler {
  slug = 'openrouter';
  name = 'OpenRouter';

  buildRequest(params: ProviderHandlerParams): ProviderHandlerResult {
    const targetUrl = buildCfGatewayUrl(params.cfAccountId, params.cfGatewayId, 'openrouter', params.effectiveUpstreamPath);
    const headers = buildCfHeaders(params.cfApiToken, params.upstreamApiKey, 'Authorization', 'Bearer ');
    return { targetUrl, headers };
  }
}
