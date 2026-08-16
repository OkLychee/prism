import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, User, Bot, Clock, Coins, Code, Loader2, Download } from 'lucide-react';
import type { RequestLog } from '@oklychee/prism-shared';
import { api } from '../api';

interface Props {
  logs: RequestLog[];
  candidateNamesMap?: Record<string, string>;
  selectedCandidateId?: string;
  hideFilterControls?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export const CandidateTimeline: React.FC<Props> = ({ 
  logs, 
  candidateNamesMap = {}, 
  selectedCandidateId,
  hideFilterControls = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}) => {
  const { t } = useTranslation();
  const [expandedSystemPrompts, setExpandedSystemPrompts] = useState<Record<string, boolean>>({});
  const [userPromptOnly, setUserPromptOnly] = useState<boolean>(false);
  const [loadedDetails, setLoadedDetails] = useState<Record<string, { full_payload?: string; response_content?: string }>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const bottomObserverRef = useRef<HTMLDivElement | null>(null);

  const toggleSystemPrompt = (logId: string) => {
    setExpandedSystemPrompts(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const handleFetchFullDetail = async (logId: string) => {
    if (loadedDetails[logId] || loadingDetailId === logId) return;
    setLoadingDetailId(logId);
    try {
      const detail = await api.getLogDetail(logId);
      if (detail) {
        setLoadedDetails((prev) => ({
          ...prev,
          [logId]: {
            full_payload: detail.full_payload,
            response_content: detail.response_content,
          },
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetailId(null);
    }
  };

  // IntersectionObserver for auto loading more on scroll to bottom
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;

    const el = bottomObserverRef.current;
    if (!el) return;

    // Find the scrollable container (<main className="flex-1 overflow-y-auto">)
    const scrollContainer = el.closest('main');

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { root: scrollContainer, rootMargin: '200px', threshold: 0 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, onLoadMore, logs.length]);

  // Filter logs for interview review
  const filteredLogs = logs.filter(log => {
    if (selectedCandidateId && selectedCandidateId !== 'all' && log.key_id !== selectedCandidateId) {
      return false;
    }
    if (userPromptOnly && (log.user_prompt_count === 0 || Boolean(log.is_repeated_loop))) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Optional Filter Controls Bar */}
      {!hideFilterControls && (
        <div className="bg-color-bg-sidebar p-4 rounded-2xl border border-theme-border flex items-center justify-end gap-4">
          {/* User Prompt Only Toggle */}
          <button
            type="button"
            onClick={() => setUserPromptOnly(!userPromptOnly)}
            className={`px-3 py-2 rounded-xl border text-xs font-medium transition flex items-center space-x-2 cursor-pointer ${
              userPromptOnly
                ? 'bg-primary-red-muted border-primary-red/40 text-primary-red'
                : 'bg-color-bg-card border-theme-border text-color-text-muted hover:text-color-text-main'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t('timeline.userPromptOnly')}</span>
          </button>
        </div>
      )}

      {/* Timeline Event List */}
      <div className={`space-y-4 relative ${filteredLogs.length > 0 ? 'before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-theme-border' : ''}`}>
        {filteredLogs.length === 0 ? (
          <div className="bg-color-bg-sidebar p-8 text-center text-color-text-muted rounded-2xl border border-theme-border">
            {t('timeline.empty')}
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isRepeatedLoop = Boolean(log.is_repeated_loop);
            const isDirectUserPrompt = log.user_prompt_count > 0 && !isRepeatedLoop;
            const isSystemExpanded = !!expandedSystemPrompts[log.id];

            return (
              <div key={log.id} className="relative pl-12 group">
                {/* Timeline Dot Icon */}
                <div
                  className={`absolute left-3 top-4 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center border text-xs transition ${
                    isDirectUserPrompt
                      ? 'bg-primary-red border-primary-red/50 text-white shadow-md shadow-primary-red/25 ring-4 ring-color-bg-main'
                      : 'bg-color-bg-sidebar border-theme-border text-color-text-muted ring-4 ring-color-bg-main'
                  }`}
                >
                  {isDirectUserPrompt ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Log Event Card */}
                <div
                  className={`bg-color-bg-sidebar p-5 rounded-2xl border transition ${
                    isDirectUserPrompt
                      ? 'border-primary-red/40 bg-primary-red-muted/10 hover:border-primary-red/60'
                      : 'border-theme-border hover:border-theme-border-strong'
                  }`}
                >
                  {/* Card Header Info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-theme-border">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-color-text-main text-sm">
                        {candidateNamesMap[log.key_id] || 'Candidate Key'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-color-bg-card text-color-text-muted border border-theme-border">
                        {log.model}
                      </span>
                      {isDirectUserPrompt ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-primary-red-muted text-primary-red border border-primary-red/30 flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{t('timeline.userPromptBadge')}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-color-bg-card text-color-text-muted border border-theme-border flex items-center space-x-1">
                          <Bot className="w-3 h-3" />
                          <span>{t('timeline.autoLoopBadge')}</span>
                        </span>
                      )}

                      {Boolean(log.is_repeated_loop) && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center space-x-1 animate-pulse">
                          <span>⚠️ {t('timeline.repeatedLoopBadge')}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-xs font-mono text-color-text-muted">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-color-text-muted/70" />
                        <span>{log.duration_ms}ms</span>
                      </div>
                      {(() => {
                        const cacheRead = log.cache_read_input_tokens || 0;
                        const chargedTokens = Math.max(0, log.prompt_tokens - cacheRead) + log.completion_tokens;
                        const totalTokens = log.prompt_tokens + log.completion_tokens;

                        return (
                          <div className="flex items-center space-x-1.5 text-[11px] font-mono">
                            <div className="flex items-center space-x-1" title={`Uncached Input (${Math.max(0, log.prompt_tokens - cacheRead).toLocaleString()}) + Completion (${log.completion_tokens.toLocaleString()}) = Charged Quota (Total: ${totalTokens.toLocaleString()})`}>
                              <Coins className="w-3.5 h-3.5 text-amber-500/80" />
                              <span>{chargedTokens.toLocaleString()} tokens</span>
                            </div>
                            {Boolean(cacheRead) && (
                              <>
                                <span className="text-color-text-muted/60 font-sans text-xs">+</span>
                                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20" title={`Cache Read (${cacheRead.toLocaleString()} tokens - 0% charged)`}>
                                  ⚡ {cacheRead.toLocaleString()} cached
                                </span>
                              </>
                            )}
                            {Boolean(log.cache_creation_input_tokens) && (
                              <span className="text-[10px] text-sky-400 font-mono bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20" title="Cache Write / Creation Input">
                                💾 {log.cache_creation_input_tokens?.toLocaleString()} write
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      <span className="text-color-text-muted/70">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* System Prompt (Collapsible) */}
                  {log.system_prompt && (
                    <div className="mb-3">
                      <button
                        onClick={() => toggleSystemPrompt(log.id)}
                        className="flex items-center space-x-2 text-xs font-medium text-color-text-muted hover:text-color-text-main transition py-1 cursor-pointer"
                      >
                        {isSystemExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-primary-red" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-color-text-muted" />
                        )}
                        <span>{t('timeline.systemPrompt')}</span>
                      </button>

                      {isSystemExpanded && (
                        <div className="mt-2 p-3 bg-color-bg-card rounded-xl border border-theme-border text-xs font-mono text-color-text-muted whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                          {log.system_prompt}
                        </div>
                      )}
                    </div>
                  )}

                  {/* User Prompt (Highlighted) */}
                  {log.user_prompt && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-primary-red mb-1 flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-primary-red" />
                        <span>{t('timeline.userPrompt')}</span>
                      </div>
                      <div className="p-3.5 bg-primary-red-muted/20 border border-primary-red/30 rounded-xl text-xs font-sans text-color-text-main whitespace-pre-wrap leading-relaxed">
                        {log.user_prompt}
                      </div>
                    </div>
                  )}

                  {/* AI Response Preview / Full Content */}
                  {(() => {
                    const loadedDetail = loadedDetails[log.id];
                    const rawResponse = loadedDetail ? loadedDetail.response_content : log.response_content;
                    const effectiveResponse = typeof rawResponse === 'object' && rawResponse !== null
                      ? JSON.stringify(rawResponse, null, 2)
                      : rawResponse;

                    const isStoredInR2 = Boolean(log.r2_log_key);

                    if (effectiveResponse) {
                      return (
                        <div>
                          <div className="text-xs font-semibold text-color-text-muted mb-1 flex items-center space-x-1.5">
                            <Code className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{t('timeline.responseContent')}</span>
                            {isStoredInR2 && (
                              <span className="text-[10px] text-color-text-muted font-mono bg-color-bg-card px-1.5 py-0.5 rounded border border-theme-border">
                                R2 Storage
                              </span>
                            )}
                          </div>
                          <div className="p-3 bg-color-bg-card border border-theme-border rounded-xl text-xs font-mono text-color-text-main whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                            {effectiveResponse}
                          </div>
                        </div>
                      );
                    }

                    if (isStoredInR2) {
                      return (
                        <div>
                          <button
                            type="button"
                            onClick={() => handleFetchFullDetail(log.id)}
                            disabled={loadingDetailId === log.id}
                            className="px-3 py-1.5 bg-color-bg-card border border-theme-border hover:border-primary-red/50 rounded-xl text-xs font-mono text-color-text-muted hover:text-primary-red transition flex items-center space-x-2 cursor-pointer"
                          >
                            {loadingDetailId === log.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-red" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-primary-red" />
                            )}
                            <span>从 R2 读取完整响应记录...</span>
                          </button>
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>
              </div>
            );
          })
        )}

        {/* Sentinel element for infinite scrolling & loading indicator */}
        <div ref={bottomObserverRef} className="py-4 text-center">
          {isLoadingMore && (
            <div className="flex items-center justify-center space-x-2 text-xs text-color-text-muted">
              <Loader2 className="w-4 h-4 animate-spin text-primary-red" />
              <span>正在加载更多历史对话...</span>
            </div>
          )}
          {!isLoadingMore && hasMore && onLoadMore && (
            <button
              type="button"
              onClick={onLoadMore}
              className="px-4 py-2 bg-color-bg-sidebar border border-theme-border hover:border-primary-red/50 rounded-xl text-xs font-medium text-color-text-muted hover:text-primary-red transition cursor-pointer"
            >
              点击加载更多历史对话
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
