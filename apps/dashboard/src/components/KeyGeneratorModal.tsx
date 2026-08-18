import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Terminal, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../api';
import type { InterviewKey, UpstreamConfig } from '@oklychee/prism-shared';
import { Button, Badge, DateTimePicker } from './ui';
import { getProviderTypeLabel } from '../utils/provider';
import { getDefaultExpirationIsoString, datetimeStringToTimestamp } from '../utils/date';

import { getAgentGuides, generateMarkdownInvitation } from '../utils/invitation';

interface Props {
  onKeyCreated?: (newKey: InterviewKey) => void;
  upstreams?: UpstreamConfig[];
}

export const KeyGeneratorModal: React.FC<Props> = ({ onKeyCreated, upstreams = [] }) => {
  const { t, i18n } = useTranslation();
  const [candidateName, setCandidateName] = useState('');
  const [quotaType, setQuotaType] = useState<'tokens' | 'usd'>('tokens');
  const [quotaLimit, setQuotaLimit] = useState<number>(1000000);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [expirationDt, setExpirationDt] = useState<string>(() => getDefaultExpirationIsoString(7));

  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<'claudeCode' | 'codex' | 'cursor' | 'aider'>('claudeCode');

  const toggleModel = (uniqueModelId: string) => {
    if (selectedModels.includes(uniqueModelId)) {
      setSelectedModels(selectedModels.filter(m => m !== uniqueModelId));
    } else {
      setSelectedModels([...selectedModels, uniqueModelId]);
    }
  };

  const handleGenerate = async () => {
    if (!candidateName.trim()) return;

    const expiresAt = datetimeStringToTimestamp(expirationDt);
    const payload = {
      candidate_name: candidateName,
      quota_type: quotaType,
      quota_limit: quotaLimit,
      allowed_models: selectedModels,
      expires_at: expiresAt,
    };

    try {
      const created = await api.createKey(payload);
      if (created && created.key_hash) {
        setGeneratedKey(created.key_hash);
      }
      if (onKeyCreated) onKeyCreated(created);
    } catch (err: any) {
      console.error('Failed to create key:', err);
    }
  };

  const handleCopyInvitation = () => {
    if (!generatedKey) return;
    const text = generateMarkdownInvitation({
      candidateName,
      apiKey: generatedKey,
      quotaType,
      quotaLimit,
      allowedModels: selectedModels,
      expiresAt: expirationDt,
      lang: i18n.language,
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Form Container */}
      <div className="bg-color-bg-sidebar p-6 rounded-2xl border border-theme-border space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Candidate Name */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-color-text-muted">
              {t('keyGenerator.candidateName')} <span className="text-primary-red">*</span>
            </label>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder={t('keyGenerator.candidatePlaceholder')}
              className="w-full px-4 py-2.5 bg-color-bg-card border border-theme-border rounded-xl text-color-text-main text-xs placeholder-color-text-muted/60 focus:outline-none focus:border-primary-red transition"
            />
          </div>

          {/* Expiration Datetime */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-color-text-muted">{t('keyGenerator.expirationDate')}</label>
            <DateTimePicker
              value={expirationDt}
              onChange={(val) => setExpirationDt(val)}
            />
          </div>

          {/* Combined Quota Group: Type Selector + Limit Input */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium text-color-text-muted">
              {t('keyGenerator.quotaType')} & {t('keyGenerator.quotaLimit')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tokens Button */}
              <button
                type="button"
                onClick={() => { setQuotaType('tokens'); setQuotaLimit(1000000); }}
                className={`px-4 py-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  quotaType === 'tokens'
                    ? 'bg-primary-red-muted border-primary-red text-primary-red'
                    : 'bg-color-bg-card border-theme-border text-color-text-muted hover:border-color-text-muted'
                }`}
              >
                {t('keyGenerator.quotaTokens')}
              </button>
              {/* USD Button (Disabled - Coming soon) */}
              <button
                type="button"
                disabled
                title={t('keyGenerator.comingSoon')}
                className="px-4 py-2.5 rounded-xl border text-xs font-medium bg-color-bg-card/50 border-theme-border/50 text-color-text-muted/40 cursor-not-allowed relative group"
              >
                <span>{t('keyGenerator.quotaUSD')}</span>
                <span className="ml-1 text-[10px] text-color-text-muted/60">
                  ({t('keyGenerator.comingSoon')})
                </span>
              </button>
              {/* Limit Input */}
              <div className="relative">
                <input
                  type="number"
                  value={quotaLimit}
                  onChange={(e) => setQuotaLimit(Number(e.target.value))}
                  placeholder="Limit Value"
                  className="w-full px-4 py-2.5 bg-color-bg-card border border-theme-border rounded-xl text-color-text-main text-xs focus:outline-none focus:border-primary-red transition font-mono pr-14"
                />
                <span className="absolute right-3 top-2.5 text-xs text-color-text-muted font-mono">
                  {quotaType === 'tokens' ? 'Tokens' : 'USD'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Model Whitelist Selection - Grouped by Upstream Provider */}
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-color-text-muted flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-primary-red" />
              <span>{t('keyGenerator.allowedModels')}</span>
            </label>
            <p className="text-[11px] text-color-text-muted/70">
              {t('keyGenerator.modelDuplicateTip')}
            </p>
          </div>

          {upstreams.length === 0 || upstreams.every(u => !u.available_models || u.available_models.length === 0) ? (
            <div className="p-4 rounded-xl border border-theme-border bg-color-bg-card text-xs text-color-text-muted font-mono">
              {t('keyGenerator.noModelsConfigured')}
            </div>
          ) : (
            <div className="space-y-4">
              {upstreams
                .filter((u) => Array.isArray(u.available_models) && u.available_models.length > 0)
                .map((provider) => (
                  <div key={provider.id || provider.name} className="space-y-2">
                    <div className="flex items-center space-x-2 text-[11px] font-semibold text-color-text-muted border-b border-theme-border pb-1.5">
                      <span className="text-primary-red font-mono">[{getProviderTypeLabel(provider.provider_type)}]</span>
                      <span>{provider.name}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                      {provider.available_models.map((modelId) => {
                        const uniqueKey = `${provider.id}::${modelId}`;
                        const checked = selectedModels.includes(uniqueKey);
                        return (
                          <div
                            key={uniqueKey}
                            onClick={() => toggleModel(uniqueKey)}
                            className={`p-2.5 rounded-xl border cursor-pointer text-xs font-mono transition flex items-center justify-between ${
                              checked
                                ? 'bg-primary-red-muted border-primary-red text-primary-red'
                                : 'bg-color-bg-card border-theme-border text-color-text-muted hover:border-color-text-muted'
                            }`}
                          >
                            <span className="truncate pr-2">{modelId}</span>
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                              checked ? 'bg-primary-red border-primary-red text-white' : 'border-theme-border'
                            }`}>
                              {checked && <Check className="w-2.5 h-2.5" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            disabled={!candidateName.trim()}
            onClick={handleGenerate}
            icon={<Sparkles className="w-4 h-4" />}
            className="w-full py-2.5 text-xs font-semibold cursor-pointer"
          >
            {t('keyGenerator.generateBtn')}
          </Button>
        </div>
      </div>

      {/* Generated Result & Markdown Guide */}
      {generatedKey && (
        <div className="bg-color-bg-sidebar p-6 rounded-2xl border border-status-green/40 space-y-6">
          <div className="flex items-center justify-between border-b border-theme-border pb-4">
            <div className="flex items-center space-x-3">
              <Badge variant="green" icon={<Check className="w-3 h-3" />}>
                {t('keyGenerator.generatedSuccess')}
              </Badge>
              <span className="text-xs font-mono text-status-green">{generatedKey}</span>
            </div>
            <Button
              variant="outline"
              icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={handleCopyInvitation}
            >
              {copied ? t('keyGenerator.copied') : t('keyGenerator.copyInvitation')}
            </Button>
          </div>

          {/* Interactive Agent Guide Switcher */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-color-text-muted flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-primary-red" />
                <span>{t('keyGenerator.selectAgent')}</span>
              </label>
              <div className="flex space-x-2">
                {(['claudeCode', 'codex', 'aider', 'cursor'] as const).map((agentKey) => (
                  <button
                    key={agentKey}
                    onClick={() => setSelectedAgent(agentKey)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                      selectedAgent === agentKey
                        ? 'bg-primary-red text-white'
                        : 'bg-color-bg-card text-color-text-muted hover:bg-color-bg-card-hover border border-theme-border'
                    }`}
                  >
                    {agentKey.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Terminal Box for Config */}
            <div className="space-y-2">
              <span className="text-xs text-color-text-muted font-medium">{t('keyGenerator.configGuide')}</span>
              <div className="bg-color-bg-card p-4 rounded-xl border border-theme-border font-mono text-xs text-status-green overflow-x-auto relative group">
                <pre>{getAgentGuides(generatedKey, selectedModels)[selectedAgent].config}</pre>
              </div>
            </div>

            {/* Terminal Box for Cleanup */}
            <div className="space-y-2">
              <span className="text-xs text-color-text-muted font-medium">{t('keyGenerator.unsetGuide')}</span>
              <div className="bg-color-bg-card p-4 rounded-xl border border-theme-border font-mono text-xs text-primary-red overflow-x-auto">
                <pre>{getAgentGuides(generatedKey, selectedModels)[selectedAgent].unset}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
