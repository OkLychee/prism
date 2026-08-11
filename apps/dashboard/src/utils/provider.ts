import i18next from 'i18next';

export function getProviderTypeLabel(
  type: 'cf_workers_ai' | 'cf_ai_gateway' | 'custom' | string,
  t?: (key: string) => string
): string {
  const translate = t || i18next.t.bind(i18next);
  if (type === 'cf_ai_gateway') return translate('upstreams.providerTypes.cf_ai_gateway') || 'Cloudflare AI Gateway';
  if (type === 'cf_workers_ai') return translate('upstreams.providerTypes.cf_workers_ai') || 'Cloudflare Workers AI';
  if (type === 'custom') return translate('upstreams.providerTypes.custom') || '自定义';
  return type;
}

export function getAigProviderLabel(slug?: string): string {
  if (!slug) return '';
  const map: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    'google-ai-studio': 'Google AI Studio',
    google: 'Google AI Studio',
    grok: 'xAI / Grok',
    openrouter: 'OpenRouter',
  };
  return map[slug.toLowerCase()] || slug;
}
