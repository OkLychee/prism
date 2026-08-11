import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Key,
  Users,
  Activity,
  Layers,
  Settings,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../api';
import { DashboardLayout } from '../../components/layout';
import type { SidebarGroup } from '../../components/layout';
import { KeyGeneratorModal } from '../../components/KeyGeneratorModal';
import { CandidateKeyList } from '../../components/CandidateKeyList';
import { UpstreamsPage } from './settings/upstreams';
import { SystemSettingsPage } from './settings/system';
import { CandidateUsagePage } from './interview';
import { CandidateTimelineDetailPage } from './interview/detail';
import type { InterviewKey, RequestLog, UpstreamConfig } from '@oklychee/prism-shared';

type TabType = 'overview' | 'generator' | 'keysList' | 'interviewList' | 'interviewDetail' | 'upstreams' | 'systemSettings';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // Infer activeTab from current URL location path
  const getTabFromPath = (pathname: string): TabType => {
    if (pathname.includes('/key/list')) return 'keysList';
    if (pathname.includes('/key/generator')) return 'generator';
    if (pathname.includes('/interview/detail')) return 'interviewDetail';
    if (pathname.includes('/interview')) return 'interviewList';
    if (pathname.includes('/settings/upstreams')) return 'upstreams';
    if (pathname.includes('/settings/system')) return 'systemSettings';
    return 'overview';
  };

  const activeTab = getTabFromPath(location.pathname);

  const [keys, setKeys] = useState<InterviewKey[]>([]);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [upstreams, setUpstreams] = useState<UpstreamConfig[]>([]);

  const fetchKeys = async () => {
    const fetchedKeys = await api.getKeys();
    setKeys(fetchedKeys || []);
  };

  const fetchUpstreams = async () => {
    const fetchedUpstreams = await api.getUpstreams();
    setUpstreams(fetchedUpstreams || []);
  };

  useEffect(() => {
    async function loadData() {
      fetchKeys();
      const fetchedLogs = await api.getLogs();
      setLogs(fetchedLogs || []);
      fetchUpstreams();
    }
    loadData();
  }, []);

  const handleKeyCreated = (newKey: InterviewKey) => {
    setKeys((prev) => [newKey, ...prev]);
  };

  const totalUserPrompts = logs.reduce((acc, curr) => acc + curr.user_prompt_count, 0);

  // Grouped Navigation Items for Sidebar with router paths
  const navGroups: SidebarGroup[] = [
    {
      id: 'overview',
      items: [
        {
          id: 'overview',
          label: t('nav.overview'),
          icon: <BarChart2 className="w-4 h-4" />,
          active: activeTab === 'overview',
          onClick: () => navigate('/dashboard'),
        },
      ],
    },
    {
      id: 'groupKeys',
      title: t('nav.groupKeys'),
      items: [
        {
          id: 'generator',
          label: t('nav.keys'),
          icon: <Key className="w-4 h-4" />,
          active: activeTab === 'generator',
          onClick: () => navigate('/dashboard/key/generator'),
        },
        {
          id: 'keysList',
          label: t('nav.keyList'),
          icon: <Users className="w-4 h-4" />,
          active: activeTab === 'keysList',
          onClick: () => navigate('/dashboard/key/list'),
        },
      ],
    },
    {
      id: 'groupInterview',
      title: t('nav.groupInterview'),
      items: [
        {
          id: 'interviewList',
          label: t('nav.timeline'),
          icon: <Activity className="w-4 h-4" />,
          active: activeTab === 'interviewList' || activeTab === 'interviewDetail',
          onClick: () => navigate('/dashboard/interview'),
        },
      ],
    },
    {
      id: 'groupSettings',
      title: t('nav.groupSettings'),
      items: [
        {
          id: 'upstreams',
          label: t('nav.upstreams'),
          icon: <Layers className="w-4 h-4" />,
          active: activeTab === 'upstreams',
          onClick: () => navigate('/dashboard/settings/upstreams'),
        },
        {
          id: 'systemSettings',
          label: t('nav.systemSettings'),
          icon: <Settings className="w-4 h-4" />,
          active: activeTab === 'systemSettings',
          onClick: () => navigate('/dashboard/settings/system'),
        },
      ],
    },
  ];

  // Breadcrumbs & Page Metadata Map
  const pageMetaMap: Record<TabType, { title: string; desc: string; breadcrumb: string }> = {
    overview: {
      title: t('nav.overview'),
      desc: t('app.subtitle'),
      breadcrumb: t('nav.overview'),
    },
    generator: {
      title: t('keyGenerator.title'),
      desc: t('keyGenerator.desc'),
      breadcrumb: t('nav.keys'),
    },
    keysList: {
      title: t('keyList.title'),
      desc: t('keyList.desc'),
      breadcrumb: t('nav.keyList'),
    },
    interviewList: {
      title: t('timeline.title'),
      desc: t('timeline.desc'),
      breadcrumb: t('nav.timeline'),
    },
    interviewDetail: {
      title: t('timeline.title'),
      desc: t('timeline.desc'),
      breadcrumb: t('nav.timeline'),
    },
    upstreams: {
      title: t('upstreams.title'),
      desc: t('upstreams.desc'),
      breadcrumb: t('nav.upstreams'),
    },
    systemSettings: {
      title: t('settings.title'),
      desc: t('settings.desc'),
      breadcrumb: t('nav.systemSettings'),
    },
  };

  const currentMeta = pageMetaMap[activeTab];

  return (
    <DashboardLayout
      navGroups={navGroups}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: currentMeta.breadcrumb },
      ]}
      currentTitle={currentMeta.title}
      currentDescription={currentMeta.desc}
    >
      {/* 1. Overview Page View (/dashboard) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Active Keys Card */}
            <div className="bg-color-bg-card p-5 rounded-2xl border border-theme-border flex items-center space-x-4">
              <div className="p-3 bg-primary-red-muted text-primary-red rounded-xl border border-primary-red/30">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-color-text-muted">{t('stats.totalKeys')}</span>
                <div className="text-2xl font-bold text-color-text-main mt-0.5">{keys.length}</div>
              </div>
            </div>

            {/* Total Requests Card */}
            <div className="bg-color-bg-card p-5 rounded-2xl border border-theme-border flex items-center space-x-4">
              <div className="p-3 bg-indigo-500/15 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-color-text-muted">{t('stats.totalRequests')}</span>
                <div className="text-2xl font-bold text-color-text-main mt-0.5">{logs.length}</div>
              </div>
            </div>

            {/* User Prompts Card */}
            <div className="bg-color-bg-card p-5 rounded-2xl border border-theme-border flex items-center space-x-4">
              <div className="p-3 bg-status-green/15 text-status-green rounded-xl border border-status-green/30">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-color-text-muted">{t('stats.userPrompts')}</span>
                <div className="text-2xl font-bold text-status-green mt-0.5">{totalUserPrompts}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Key Generator View */}
      {activeTab === 'generator' && (
        <KeyGeneratorModal onKeyCreated={handleKeyCreated} upstreams={upstreams} />
      )}

      {/* 3. Candidate Key List View (/dashboard/key/list) */}
      {activeTab === 'keysList' && (
        <CandidateKeyList keys={keys} upstreams={upstreams} onRefresh={fetchKeys} />
      )}

      {/* 4. Candidate Usage List View (/dashboard/interview) */}
      {activeTab === 'interviewList' && (
        <CandidateUsagePage keys={keys} />
      )}

      {/* 5. Candidate Timeline Detail View (/dashboard/interview/:id) */}
      {activeTab === 'interviewDetail' && (
        <CandidateTimelineDetailPage logs={logs} keys={keys} />
      )}

      {/* 6. Upstream Configs View */}
      {activeTab === 'upstreams' && (
        <UpstreamsPage />
      )}

      {/* 7. System Settings View */}
      {activeTab === 'systemSettings' && (
        <SystemSettingsPage />
      )}
    </DashboardLayout>
  );
};

