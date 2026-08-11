import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Key, ShieldAlert, ShieldCheck, Trash2, Clock, Cpu, Ban, CheckCircle2, ExternalLink, Edit2, Copy, Check } from 'lucide-react';
import type { InterviewKey, UpstreamConfig } from '@oklychee/prism-shared';
import { api } from '../api';
import { Badge, Button, ProgressBar } from './ui';
import { CandidateKeyEditModal } from './CandidateKeyEditModal';
import { formatTimestamp } from '../utils/date';
import { generateMarkdownInvitation } from '../utils/invitation';

interface Props {
  keys: InterviewKey[];
  upstreams?: UpstreamConfig[];
  onRefresh: () => void;
}

export const CandidateKeyList: React.FC<Props> = ({ keys, upstreams = [], onRefresh }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [editingKey, setEditingKey] = useState<InterviewKey | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [, setTimezoneTick] = useState(0);

  useEffect(() => {
    const handleTimezoneChange = () => setTimezoneTick((t) => t + 1);
    window.addEventListener('prism_timezone_changed', handleTimezoneChange);
    return () => window.removeEventListener('prism_timezone_changed', handleTimezoneChange);
  }, []);

  const handleCopyInvitation = (keyItem: InterviewKey) => {
    const text = generateMarkdownInvitation({
      candidateName: keyItem.candidate_name,
      apiKey: keyItem.key_hash,
      quotaType: keyItem.quota_type as 'tokens' | 'usd',
      quotaLimit: keyItem.quota_limit,
      allowedModels: keyItem.allowed_models || [],
      expiresAt: keyItem.expires_at,
      lang: i18n.language,
    });

    navigator.clipboard.writeText(text);
    setCopiedKeyId(keyItem.id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleToggleStatus = async (keyItem: InterviewKey) => {
    const nextStatus = keyItem.status === 'active' ? 'revoked' : 'active';
    try {
      await api.updateKeyStatus(keyItem.id, nextStatus);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('keyList.deleteConfirm'))) return;
    try {
      await api.deleteKey(id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-color-bg-sidebar p-6 rounded-2xl border border-theme-border space-y-6">
      {editingKey && (
        <CandidateKeyEditModal
          keyItem={editingKey}
          upstreams={upstreams}
          onClose={() => setEditingKey(null)}
          onSuccess={() => {
            setEditingKey(null);
            onRefresh();
          }}
        />
      )}

      {keys.length === 0 ? (
        <div className="bg-color-bg-card p-12 text-center text-color-text-muted rounded-xl border border-theme-border space-y-3">
          <Key className="w-10 h-10 mx-auto text-color-text-muted stroke-[1.5]" />
          <p className="text-sm">{t('keyList.empty')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-theme-border text-color-text-muted font-medium">
                <th className="py-3 px-4">{t('keyList.candidate')}</th>
                <th className="py-3 px-4">{t('keyList.keyHash')}</th>
                <th className="py-3 px-4">{t('keyList.quotaUsage')}</th>
                <th className="py-3 px-4">{t('keyList.status')}</th>
                <th className="py-3 px-4">{t('keyList.expiresAt')}</th>
                <th className="py-3 px-4 text-right">{t('keyList.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border text-color-text-main">
              {keys.map((k) => {
                const isExpired = k.expires_at > 0 && Date.now() > k.expires_at;
                const isExhausted = k.quota_used >= k.quota_limit;
                const isRevoked = k.status === 'revoked';

                let statusBadge = (
                  <Badge variant="green" icon={<ShieldCheck className="w-3 h-3" />}>
                    {t('keyList.active')}
                  </Badge>
                );

                if (isRevoked) {
                  statusBadge = (
                    <Badge variant="red" icon={<ShieldAlert className="w-3 h-3" />}>
                      {t('keyList.disabled')}
                    </Badge>
                  );
                } else if (isExpired) {
                  statusBadge = (
                    <Badge variant="amber" icon={<Clock className="w-3 h-3" />}>
                      {t('keyList.expired')}
                    </Badge>
                  );
                } else if (isExhausted) {
                  statusBadge = (
                    <Badge variant="red" icon={<Cpu className="w-3 h-3" />}>
                      {t('keyList.exhausted')}
                    </Badge>
                  );
                }

                const quotaPercent = Math.min(100, Math.round((k.quota_used / k.quota_limit) * 100));

                return (
                  <tr key={k.id} className="hover:bg-color-bg-card transition border-b border-theme-border">
                    <td className="py-3.5 px-4 font-semibold text-color-text-main">
                      {k.candidate_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-color-text-muted">
                      {k.key_hash ? `${k.key_hash.substring(0, 16)}...` : '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 w-36">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span>{k.quota_used.toLocaleString()}</span>
                          <span className="text-color-text-muted">/ {k.quota_limit.toLocaleString()}</span>
                        </div>
                        <ProgressBar value={quotaPercent} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{statusBadge}</td>
                    <td className="py-3.5 px-4 font-mono text-color-text-muted">
                      {formatTimestamp(k.expires_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Copy Invitation Button */}
                        <Button
                          variant="outline"
                          icon={copiedKeyId === k.id ? <Check className="w-3.5 h-3.5 text-status-green" /> : <Copy className="w-3.5 h-3.5" />}
                          onClick={() => handleCopyInvitation(k)}
                        >
                          {copiedKeyId === k.id ? t('keyGenerator.copied') : t('keyList.copyInvitationBtn')}
                        </Button>

                        {/* Interview Detail Navigation Button */}
                        <Button
                          variant="outline"
                          icon={<ExternalLink className="w-3.5 h-3.5" />}
                          onClick={() => navigate(`/dashboard/interview/detail?id=${k.id}`)}
                        >
                          {t('keyList.detailBtn')}
                        </Button>

                        {/* Edit Button */}
                        <Button
                          variant="outline"
                          icon={<Edit2 className="w-3.5 h-3.5" />}
                          onClick={() => setEditingKey(k)}
                        >
                          {t('keyList.editBtn')}
                        </Button>

                        {/* Enable / Disable Status Toggle Button with Lucide Icons */}
                        <Button
                          variant={k.status === 'active' ? 'primary' : 'outline'}
                          icon={
                            k.status === 'active' ? (
                              <Ban className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )
                          }
                          onClick={() => handleToggleStatus(k)}
                        >
                          {k.status === 'active' ? t('keyList.disableBtn') : t('keyList.enableBtn')}
                        </Button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(k.id)}
                          className="p-1.5 rounded-lg text-color-text-muted hover:text-rose-400 hover:bg-primary-red-muted transition cursor-pointer"
                          title={t('keyList.deleteBtn')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
