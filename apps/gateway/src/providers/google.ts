import { ProviderHandler, ProviderHandlerParams, ProviderHandlerResult, buildCfGatewayUrl, buildCfHeaders } from './base';

export class GoogleAiStudioProviderHandler implements ProviderHandler {
  slug = 'google-ai-studio';
  name = 'Google AI Studio';

  buildRequest(params: ProviderHandlerParams): ProviderHandlerResult {
    const targetUrl = buildCfGatewayUrl(params.cfAccountId, params.cfGatewayId, 'google-ai-studio', params.effectiveUpstreamPath);
    const headers = buildCfHeaders(params.cfApiToken, params.upstreamApiKey, 'x-goog-api-key', '');
    return { targetUrl, headers };
  }
}
