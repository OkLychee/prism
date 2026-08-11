import React, { useEffect, useState } from 'react';
import type { InterviewKey, UpstreamConfig } from '@oklychee/prism-shared';
import { api } from '../../../api';
import { CandidateKeyList } from '../../../components/CandidateKeyList';

export const CandidateKeyListPage: React.FC = () => {
  const [keys, setKeys] = useState<InterviewKey[]>([]);
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
    fetchKeys();
    fetchUpstreams();
  }, []);

  return <CandidateKeyList keys={keys} upstreams={upstreams} onRefresh={fetchKeys} />;
};
