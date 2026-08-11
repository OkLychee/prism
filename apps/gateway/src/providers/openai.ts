import { ProviderHandler, ProviderHandlerParams, ProviderHandlerResult, buildCfGatewayUrl, buildCfHeaders } from './base';

export class OpenAiProviderHandler implements ProviderHandler {
  slug = 'openai';
  name = 'OpenAI';

  buildRequest(params: ProviderHandlerParams): ProviderHandlerResult {
    const targetUrl = buildCfGatewayUrl(params.cfAccountId, params.cfGatewayId, 'openai', params.effectiveUpstreamPath);
    const headers = buildCfHeaders(params.cfApiToken, params.upstreamApiKey, 'Authorization', 'Bearer ');
    return { targetUrl, headers };
  }
}
