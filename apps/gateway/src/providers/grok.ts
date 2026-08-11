import { ProviderHandler, ProviderHandlerParams, ProviderHandlerResult, buildCfGatewayUrl, buildCfHeaders } from './base';

export class GrokProviderHandler implements ProviderHandler {
  slug = 'grok';
  name = 'xAI / Grok';

  buildRequest(params: ProviderHandlerParams): ProviderHandlerResult {
    const targetUrl = buildCfGatewayUrl(params.cfAccountId, params.cfGatewayId, 'grok', params.effectiveUpstreamPath);
    const headers = buildCfHeaders(params.cfApiToken, params.upstreamApiKey, 'Authorization', 'Bearer ');
    return { targetUrl, headers };
  }
}
