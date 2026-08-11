import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { RequestLog, InterviewKey } from '@oklychee/prism-shared';
import { api } from '../../../api';
import { CandidateTimeline } from '../../../components/CandidateTimeline';
import { Button } from '../../../components/ui';

interface Props {
  logs?: RequestLog[];
  keys: InterviewKey[];
}

export const CandidateTimelineDetailPage: React.FC<Props> = ({ keys }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search);
  const targetId = query.get('id') || '';

  const [detailLogs, setDetailLogs] = useState<RequestLog[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const PAGE_SIZE = 30;

  // Initial fetch for target candidate key logs
  useEffect(() => {
    async function loadInitialLogs() {
      if (!targetId) return;
      setIsLoadingMore(true);
      const res = await api.getLogsPaginated({
        keyId: targetId,
        limit: PAGE_SIZE,
        offset: 0,
      });
      setDetailLogs(res.logs || []);
      setHasMore(res.hasMore);
      setIsLoadingMore(false);
    }
    loadInitialLogs();
  }, [targetId]);

  // Load next page when scrolled to bottom
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || !targetId) return;
    setIsLoadingMore(true);
    const nextOffset = detailLogs.length;
    const res = await api.getLogsPaginated({
      keyId: targetId,
      limit: PAGE_SIZE,
      offset: nextOffset,
    });

    setDetailLogs((prev) => {
      // De-duplicate by log id
      const existingIds = new Set(prev.map((l) => l.id));
      const newUnique = res.logs.filter((l) => !existingIds.has(l.id));
      return [...prev, ...newUnique];
    });
    setHasMore(res.hasMore);
    setIsLoadingMore(false);
  };

  const currentKey = keys.find((k) => k.id === targetId);
  const candidateNamesMap = keys.reduce<Record<string, string>>((acc, curr) => {
    acc[curr.id] = curr.candidate_name;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between bg-color-bg-sidebar p-4 rounded-2xl border border-theme-border">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/dashboard/interview')}
          >
            返回列表
          </Button>
          {currentKey && (
            <div className="text-sm font-semibold text-color-text-main">
              {currentKey.candidate_name} 的 AI 编程轨迹
            </div>
          )}
        </div>
      </div>

      {/* Candidate Timeline for specific key ID */}
      <CandidateTimeline
        logs={detailLogs}
        candidateNamesMap={candidateNamesMap}
        selectedCandidateId={targetId}
        hideFilterControls={false}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
};
