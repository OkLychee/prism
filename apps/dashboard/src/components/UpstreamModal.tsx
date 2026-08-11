import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Layers, Key, Link as LinkIcon, Server, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';
import type { UpstreamConfig } from '@oklychee/prism-shared';
import { Badge } from './ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: Partial<UpstreamConfig>) => Promise<void>;
  editingConfig?: UpstreamConfig | null;
}

export const UpstreamModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  editingConfig,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [providerType, setProviderType] = useState<'cf_workers_ai' | 'cf_ai_gateway' | 'custom'>('cf_ai_gateway');
  const [cfAigProvider, setCfAigProvider] = useState<string>('openai');
  const [apiProtocol, setApiProtocol] = useState<'openai' | 'anthropic'>('openai');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [availableModelsStr, setAvailableModelsStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Security State: Track whether existing config has an API Key configured
  const [isApiKeyConfigured, setIsApiKeyConfigured] = useState(false);

  useEffect(() => {
    if (editingConfig) {
      setName(editingConfig.name || '');
      setProviderType(editingConfig.provider_type || 'cf_ai_gateway');
      setCfAigProvider(editingConfig.cf_aig_provider || 'openai');
      setApiProtocol(editingConfig.api_protocol || 'openai');
      setBaseUrl(editingConfig.base_url || '');
      setApiKey(''); // Reset input
      setIsApiKeyConfigured(Boolean((editingConfig as any).api_key_configured));
      setAvailableModelsStr(
        Array.isArray(editingConfig.available_models)
          ? editingConfig.available_models.join(', ')
          : ''
      );
    } else {
      setName('');
      setProviderType('cf_ai_gateway');
      setCfAigProvider('openai');
      setApiProtocol('openai');
      setBaseUrl('https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai');
      setApiKey('');
      setIsApiKeyConfigured(false);
      setAvailableModelsStr('gpt-4o, gpt-4o-mini');
    }
  }, [editingConfig, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: 'openai' | 'anthropic' | 'google' | 'grok' | 'openrouter' | 'cf_workers_ai') => {
    if (preset === 'cf_workers_ai') {
      setName('Cloudflare Workers AI');
      setProviderType('cf_workers_ai');
      setCfAigProvider('openai');
      setApiProtocol('openai');
      setBaseUrl('');
      setAvailableModelsStr('@cf/meta/llama-3.1-8b-instruct, @cf/qwen/qwen1.5-7b-chat');
    } else if (preset === 'openai') {
      setName('OpenAI (CF AI Gateway)');
      setProviderType('cf_ai_gateway');
      setCfAigProvider('openai');
      setApiProtocol('openai');
      setBaseUrl('');
      setAvailableModelsStr('gpt-4o, gpt-4o-mini, o3-mini');
    } else if (preset === 'anthropic') {
      setName('Anthropic (CF AI Gateway)');
      setProviderType('cf_ai_gateway');
      setCfAigProvider('anthropic');
      setApiProtocol('openai');
      setBaseUrl('');
      setAvailableModelsStr('claude-3-5-sonnet-20241022, claude-3-7-sonnet-20250219');
    } else if (preset === 'google') {
      setName('Google AI Studio (CF AI Gateway)');
      setProviderType('cf_ai_gateway');
      setCfAigProvider('google-ai-studio');
      setApiProtocol('openai');
      setBaseUrl('');
      setAvailableModelsStr('gemini-2.0-flash, gemini-1.5-pro');
    } else if (preset === 'grok') {
      setName('xAI / Grok (CF AI Gateway)');
      setProviderType('cf_ai_gateway');
      setCfAigProvider('grok');
      setApiProtocol('openai');
      setBaseUrl('');
      setAvailableModelsStr('grok-2, grok-beta');
    } else if (preset === 'openrouter') {
      setName('OpenRouter (BYOK)');
      setProviderType('cf_ai_gateway');
      setCfAigProvider('openrouter');
      setApiProtocol('openai');
      setBaseUrl('');
      setAvailableModelsStr('google/gemini-2.0-flash-lite-preview-02-05:free, meta-llama/llama-3.3-70b-instruct:free, deepseek/deepseek-r1:free, google/gemma-2-9b-it:free');
    }
  };

  const handleClearKeyInForm = () => {
    setApiKey('');
    setIsApiKeyConfigured(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const modelsArray = availableModelsStr
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      const payload: Partial<UpstreamConfig> = {
        id: editingConfig?.id,
        name,
        provider_type: providerType,
        cf_aig_provider: cfAigProvider,
        api_protocol: providerType === 'custom' ? apiProtocol : 'openai',
        base_url: providerType === 'custom' ? baseUrl : '',
        available_models: modelsArray,
      };

      if (providerType === 'cf_workers_ai') {
        payload.api_key = '';
      } else if (apiKey.trim().length > 0) {
        // User typed a new API key
        payload.api_key = apiKey.trim();
      } else if (!isApiKeyConfigured) {
        // User explicitly cleared key
        payload.api_key = '';
      }
      // If isApiKeyConfigured is true and apiKey input is empty, payload.api_key is undefined (omitted) so backend retains DB key

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-color-bg-sidebar w-full max-w-lg p-6 rounded-2xl border border-theme-border shadow-2xl relative space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-primary-red-muted text-primary-red rounded-xl border border-primary-red/30">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-color-text-main">
              {editingConfig ? t('upstreams.editModal') : t('upstreams.addModal')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-color-text-muted hover:text-color-text-main transition rounded-lg hover:bg-color-bg-card cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Preset Selector Buttons */}
          {!editingConfig && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-color-text-muted">{t('upstreams.quickSelector')}</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('cf_workers_ai')}
                  className="px-3 py-1.5 bg-color-bg-card hover:bg-color-bg-card-hover text-color-text-main border border-theme-border rounded-xl text-xs font-medium transition cursor-pointer"
                >
                  Workers AI (@cf/)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('openai')}
                  className="px-3 py-1.5 bg-color-bg-card hover:bg-color-bg-card-hover text-color-text-main border border-theme-border rounded-xl text-xs font-medium transition cursor-pointer"
                >
                  OpenAI
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('anthropic')}
                  className="px-3 py-1.5 bg-color-bg-card hover:bg-color-bg-card-hover text-color-text-main border border-theme-border rounded-xl text-xs font-medium transition cursor-pointer"
                >
                  Anthropic
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('google')}
                  className="px-3 py-1.5 bg-color-bg-card hover:bg-color-bg-card-hover text-color-text-main border border-theme-border rounded-xl text-xs font-medium transition cursor-pointer"
                >
                  Google AI Studio
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('grok')}
                  className="px-3 py-1.5 bg-color-bg-card hover:bg-color-bg-card-hover text-color-text-main border border-theme-border rounded-xl text-xs font-medium transition cursor-pointer"
                >
                  xAI / Grok
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('openrouter')}
                  className="px-3 py-1.5 bg-color-bg-card hover:bg-color-bg-card-hover text-color-text-main border border-theme-border rounded-xl text-xs font-medium transition cursor-pointer"
                >
                  OpenRouter
                </button>
              </div>
            </div>
          )}

          {/* Provider Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-color-text-muted flex items-center space-x-1.5">
              <Server className="w-3.5 h-3.5 text-primary-red" />
              <span>{t('upstreams.name')} *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. OpenAI Official / DeepSeek BYOK"
              className="w-full px-3.5 py-2 bg-color-bg-card border border-theme-border rounded-xl text-xs text-color-text-main placeholder-color-text-muted/50 focus:outline-none focus:border-primary-red transition"
            />
          </div>

          {/* Provider Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-color-text-muted">{t('upstreams.type')}</label>
            <select
              value={providerType}
              onChange={(e) => {
                const type = e.target.value as any;
                setProviderType(type);
              }}
              className="w-full px-3.5 py-2 bg-color-bg-card border border-theme-border rounded-xl text-xs text-color-text-main focus:outline-none focus:border-primary-red cursor-pointer"
            >
              <option value="cf_ai_gateway">{t('upstreams.providerTypes.cf_ai_gateway')}</option>
              <option value="cf_workers_ai">{t('upstreams.providerTypes.cf_workers_ai')}</option>
              <option value="custom">{t('upstreams.providerTypes.custom')}</option>
            </select>
          </div>

          {/* CF AI Gateway Provider Selection (Only visible when cf_ai_gateway) */}
          {providerType === 'cf_ai_gateway' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-color-text-muted">{t('upstreams.cfAigProvider')}</label>
              <select
                value={cfAigProvider}
                onChange={(e) => setCfAigProvider(e.target.value)}
                className="w-full px-3.5 py-2 bg-color-bg-card border border-theme-border rounded-xl text-xs text-color-text-main focus:outline-none focus:border-primary-red cursor-pointer"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google-ai-studio">Google AI Studio</option>
                <option value="grok">xAI / Grok</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>
          )}

          {/* API Protocol (Only visible when custom) */}
          {providerType === 'custom' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-color-text-muted">{t('upstreams.apiProtocol')}</label>
              <select
                value={apiProtocol}
                onChange={(e) => setApiProtocol(e.target.value as any)}
                className="w-full px-3.5 py-2 bg-color-bg-card border border-theme-border rounded-xl text-xs text-color-text-main focus:outline-none focus:border-primary-red cursor-pointer"
              >
                <option value="openai">OpenAI 格式 API (/v1/chat/completions)</option>
                <option value="anthropic">Anthropic 格式 API (/v1/messages)</option>
              </select>
            </div>
          )}

          {/* Base URL (Only visible when custom) */}
          {providerType === 'custom' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-color-text-muted flex items-center space-x-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-primary-red" />
                <span>{t('upstreams.baseUrl')}</span>
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="w-full px-3.5 py-2 bg-color-bg-card border border-theme-border rounded-xl text-xs font-mono text-color-text-main placeholder-color-text-muted/50 focus:outline-none focus:border-primary-red transition"
              />
            </div>
          )}

          {/* API Key (Hidden when Workers AI) */}
          {providerType !== 'cf_workers_ai' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-color-text-muted flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-primary-red" />
                  <span>{t('upstreams.apiKey')}</span>
                </label>
                {/* Status Badge & Clear Action */}
                <div className="flex items-center space-x-2">
                  {isApiKeyConfigured ? (
                    <>
                      <Badge variant="green" icon={<ShieldCheck className="w-3 h-3" />}>
                        {t('upstreams.keyConfigured')}
                      </Badge>
                      <button
                        type="button"
                        onClick={handleClearKeyInForm}
                        className="text-[11px] text-color-text-muted hover:text-rose-400 flex items-center space-x-1 transition cursor-pointer"
                        title={t('upstreams.clearApiKey')}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t('upstreams.clearApiKey')}</span>
                      </button>
                    </>
                  ) : (
                    <Badge variant="amber" icon={<ShieldAlert className="w-3 h-3" />}>
                      {t('upstreams.keyNotConfigured')}
                    </Badge>
                  )}
                </div>
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  isApiKeyConfigured
                    ? t('upstreams.keyPlaceholderConfigured')
                    : t('upstreams.keyPlaceholderEmpty')
                }
                className="w-full px-3.5 py-2 bg-color-bg-card border border-theme-border rounded-xl text-xs font-mono text-color-text-main placeholder-color-text-muted/60 focus:outline-none focus:border-primary-red transition"
              />
              {providerType === 'cf_ai_gateway' && (
                <p className="text-[11px] text-color-text-muted/75">
                  {t('upstreams.aigApiKeyTip')}
                </p>
              )}
            </div>
          )}

          {/* Available Models */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-color-text-muted">{t('upstreams.availableModels')}</label>
            <input
              type="text"
              value={availableModelsStr}
              onChange={(e) => setAvailableModelsStr(e.target.value)}
              placeholder="gpt-4o, gpt-4o-mini, claude-3-5-sonnet-20241022"
              className="w-full px-3.5 py-2 bg-color-bg-card border border-theme-border rounded-xl text-xs font-mono text-color-text-main placeholder-color-text-muted/50 focus:outline-none focus:border-primary-red transition"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-theme-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-color-bg-card hover:bg-color-bg-card-hover text-color-text-muted text-xs font-medium rounded-xl border border-theme-border transition cursor-pointer"
            >
              {t('upstreams.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 bg-primary-red hover:bg-primary-red-hover disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              {isSubmitting ? t('common.loading') : t('upstreams.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
