import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import type { UpstreamConfig } from '@oklychee/prism-shared';
import { api } from '../../../api';
import { UpstreamModal } from '../../../components/UpstreamModal';
import { getProviderTypeLabel, getAigProviderLabel } from '../../../utils/provider';

export const UpstreamsPage: React.FC = () => {
  const { t } = useTranslation();
  const [upstreams, setUpstreams] = useState<UpstreamConfig[]>([]);
  const [isUpstreamModalOpen, setIsUpstreamModalOpen] = useState(false);
  const [editingUpstream, setEditingUpstream] = useState<UpstreamConfig | null>(null);

  const fetchUpstreams = async () => {
    const fetchedUpstreams = await api.getUpstreams();
    setUpstreams(fetchedUpstreams || []);
  };

  useEffect(() => {
    fetchUpstreams();
  }, []);

  const handleOpenAddUpstream = () => {
    setEditingUpstream(null);
    setIsUpstreamModalOpen(true);
  };

  const handleOpenEditUpstream = (config: UpstreamConfig) => {
    setEditingUpstream(config);
    setIsUpstreamModalOpen(true);
  };

  const handleDeleteUpstream = async (id: string) => {
    if (!window.confirm(t('upstreams.deleteConfirm'))) return;
    try {
      await api.deleteUpstream(id);
      fetchUpstreams();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveUpstream = async (config: Partial<UpstreamConfig>) => {
    if (config.id) {
      await api.updateUpstream(config.id, config);
    } else {
      await api.createUpstream(config);
    }
    fetchUpstreams();
  };

  return (
    <div className="space-y-6">
      <div className="bg-color-bg-sidebar p-6 rounded-2xl border border-theme-border space-y-6">
        {/* Top Actions Bar */}
        <div className="flex items-center justify-end">
          <button
            onClick={handleOpenAddUpstream}
            className="px-4 py-2 bg-primary-red hover:bg-primary-red-hover text-white rounded-xl text-xs font-semibold transition flex items-center space-x-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('upstreams.addModal')}</span>
          </button>
        </div>

        {upstreams.length === 0 ? (
          <div className="bg-color-bg-card p-8 text-center text-color-text-muted rounded-xl border border-theme-border">
            {t('upstreams.empty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upstreams.map((item) => (
              <div key={item.id} className="bg-color-bg-card p-4.5 rounded-xl border border-theme-border space-y-2.5 relative">
                {/* Line 1: Title (Truncated) & Actions */}
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-color-text-main text-sm truncate min-w-0 flex-1" title={item.name}>
                    {item.name}
                  </span>
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditUpstream(item)}
                      className="p-1 text-color-text-muted hover:text-color-text-main transition cursor-pointer"
                      title={t('upstreams.edit')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUpstream(item.id)}
                      className="p-1 text-color-text-muted hover:text-rose-400 transition cursor-pointer"
                      title={t('upstreams.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Line 2: Provider Type Badges Row */}
                <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary-red-muted text-primary-red">
                    {getProviderTypeLabel(item.provider_type)}
                  </span>
                  {item.provider_type === 'cf_ai_gateway' && item.cf_aig_provider && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-status-green/15 text-status-green">
                      {getAigProviderLabel(item.cf_aig_provider)}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/15 text-indigo-400">
                    {item.api_protocol || 'openai'}
                  </span>
                </div>

                {/* Line 3: Custom Base URL (Optional) */}
                {item.provider_type === 'custom' && item.base_url && (
                  <p className="text-xs text-color-text-muted font-mono truncate">{item.base_url}</p>
                )}

                {/* Line 4: Models List */}
                <div className="text-xs text-color-text-muted font-mono truncate">
                  Models: {Array.isArray(item.available_models) ? item.available_models.join(', ') : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upstream Modal */}
      <UpstreamModal
        isOpen={isUpstreamModalOpen}
        onClose={() => setIsUpstreamModalOpen(false)}
        onSave={handleSaveUpstream}
        editingConfig={editingUpstream}
      />
    </div>
  );
};
