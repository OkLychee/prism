import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Key, ShieldAlert, ShieldCheck, Clock, Cpu, ExternalLink } from 'lucide-react';
import type { InterviewKey } from '@oklychee/prism-shared';
import { Badge, Button, ProgressBar } from '../../../components/ui';

interface Props {
  keys: InterviewKey[];
}

export const CandidateUsagePage: React.FC<Props> = ({ keys }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-color-bg-sidebar p-6 rounded-2xl border border-theme-border space-y-6">
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
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 w-44">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span>{k.quota_used.toLocaleString()}</span>
                          <span className="text-color-text-muted">/ {k.quota_limit.toLocaleString()} {k.quota_type}</span>
                        </div>
                        <ProgressBar value={quotaPercent} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{statusBadge}</td>
                    <td className="py-3.5 px-4 font-mono text-color-text-muted">
                      {formatDate(k.expires_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="outline"
                          icon={<ExternalLink className="w-3.5 h-3.5" />}
                          onClick={() => navigate(`/dashboard/interview/detail?id=${k.id}`)}
                        >
                          {t('timeline.detailBtn')}
                        </Button>
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
