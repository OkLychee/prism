import { ProviderHandler } from './base';
import { OpenAiProviderHandler } from './openai';
import { AnthropicProviderHandler } from './anthropic';
import { GoogleAiStudioProviderHandler } from './google';
import { GrokProviderHandler } from './grok';
import { OpenRouterProviderHandler } from './openrouter';

export * from './base';
export * from './openai';
export * from './anthropic';
export * from './google';
export * from './grok';
export * from './openrouter';

export class ProviderFactory {
  private static handlers: Record<string, ProviderHandler> = {
    openai: new OpenAiProviderHandler(),
    anthropic: new AnthropicProviderHandler(),
    'google-ai-studio': new GoogleAiStudioProviderHandler(),
    google: new GoogleAiStudioProviderHandler(),
    grok: new GrokProviderHandler(),
    openrouter: new OpenRouterProviderHandler(),
  };

  static getHandler(slug: string): ProviderHandler {
    const normalized = (slug || 'openai').toLowerCase().trim();
    return this.handlers[normalized] || this.handlers['openai'];
  }
}
