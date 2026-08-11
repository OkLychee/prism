import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, Check, Save, ShieldCheck } from 'lucide-react';
import type { InterviewKey, UpstreamConfig } from '@oklychee/prism-shared';
import { api } from '../api';
import { Button, DateTimePicker } from './ui';
import { getProviderTypeLabel } from '../utils/provider';
import { timestampToDatetimeString, datetimeStringToTimestamp } from '../utils/date';

interface CandidateKeyEditModalProps {
  keyItem: InterviewKey;
  upstreams?: UpstreamConfig[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CandidateKeyEditModal: React.FC<CandidateKeyEditModalProps> = ({
  keyItem,
  upstreams: initialUpstreams = [],
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();

  const [upstreams, setUpstreams] = useState<UpstreamConfig[]>(initialUpstreams);
  const [candidateName, setCandidateName] = useState(keyItem.candidate_name);
  const [quotaType, setQuotaType] = useState<'tokens' | 'usd'>(keyItem.quota_type);
  const [quotaLimit, setQuotaLimit] = useState<number>(keyItem.quota_limit);
  const [selectedModels, setSelectedModels] = useState<string[]>(keyItem.allowed_models || []);
  const [expirationDt, setExpirationDt] = useState<string>(() =>
    timestampToDatetimeString(keyItem.expires_at)
  );

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!initialUpstreams || initialUpstreams.length === 0) {
      api.getUpstreams().then((res) => {
        if (res) setUpstreams(res);
      }).catch(console.error);
    } else {
      setUpstreams(initialUpstreams);
    }
  }, [initialUpstreams]);

  useEffect(() => {
    setCandidateName(keyItem.candidate_name);
    setQuotaType(keyItem.quota_type);
    setQuotaLimit(keyItem.quota_limit);
    setSelectedModels(keyItem.allowed_models || []);
    setExpirationDt(timestampToDatetimeString(keyItem.expires_at));
  }, [keyItem]);

  const toggleModel = (uniqueModelId: string) => {
    if (selectedModels.includes(uniqueModelId)) {
      setSelectedModels(selectedModels.filter((m) => m !== uniqueModelId));
    } else {
      setSelectedModels([...selectedModels, uniqueModelId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) return;

    setSaving(true);
    setErrorMsg('');

    try {
      const expiresAt = datetimeStringToTimestamp(expirationDt);
      await api.updateKey(keyItem.id, {
        candidate_name: candidateName.trim(),
        quota_type: quotaType,
        quota_limit: quotaLimit,
        allowed_models: selectedModels,
        expires_at: expiresAt,
      });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update candidate key');
    } finally {
      setSaving(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-color-bg-sidebar border border-theme-border rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in duration-200 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme-border pb-4">
          <h2 className="text-lg font-bold text-color-text-main">
            {t('keyList.editModalTitle')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-color-text-muted hover:text-color-text-main hover:bg-color-bg-card transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-primary-red/10 border border-primary-red/30 text-primary-red text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Candidate Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-color-text-muted">
                {t('keyGenerator.candidateName')} <span className="text-primary-red">*</span>
              </label>
              <input
                type="text"
                required
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full px-4 py-2.5 bg-color-bg-card border border-theme-border rounded-xl text-color-text-main text-xs focus:outline-none focus:border-primary-red transition"
              />
            </div>

            {/* Expiration Datetime Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-color-text-muted">
                {t('keyGenerator.expirationDate')}
              </label>
              <DateTimePicker
                value={expirationDt}
                onChange={(val) => setExpirationDt(val)}
              />
            </div>

            {/* Quota Type & Limit */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-color-text-muted">
                {t('keyGenerator.quotaType')} & {t('keyGenerator.quotaLimit')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setQuotaType('tokens');
                    setQuotaLimit(1000000);
                  }}
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
                <div className="relative">
                  <input
                    type="number"
                    value={quotaLimit}
                    onChange={(e) => setQuotaLimit(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-color-bg-card border border-theme-border rounded-xl text-color-text-main text-xs focus:outline-none focus:border-primary-red transition font-mono pr-14"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-color-text-muted font-mono">
                    {quotaType === 'tokens' ? 'Tokens' : 'USD'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Model Whitelist */}
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-color-text-muted flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-primary-red" />
                <span>{t('keyGenerator.allowedModels')}</span>
              </label>
              <p className="text-[11px] text-color-text-muted/70">
                {t('keyGenerator.modelDuplicateTip')}
              </p>
            </div>

            {upstreams.length === 0 ||
            upstreams.every((u) => !u.available_models || u.available_models.length === 0) ? (
              <div className="p-4 rounded-xl border border-theme-border bg-color-bg-card text-xs text-color-text-muted font-mono">
                {t('keyGenerator.noModelsConfigured')}
              </div>
            ) : (
              <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {upstreams
                  .filter((u) => Array.isArray(u.available_models) && u.available_models.length > 0)
                  .map((provider) => (
                    <div key={provider.id || provider.name} className="space-y-2">
                      <div className="flex items-center space-x-2 text-[11px] font-semibold text-color-text-muted border-b border-theme-border pb-1.5">
                        <span className="text-primary-red font-mono">
                          [{getProviderTypeLabel(provider.provider_type)}]
                        </span>
                        <span>{provider.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
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
                              <div
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                  checked
                                    ? 'bg-primary-red border-primary-red text-white'
                                    : 'border-theme-border'
                                }`}
                              >
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

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-theme-border">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('upstreams.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving || !candidateName.trim()}
              icon={<Save className="w-4 h-4" />}
            >
              {saving ? t('common.loading') : t('upstreams.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? ReactDOM.createPortal(modalContent, document.body)
    : modalContent;
};
