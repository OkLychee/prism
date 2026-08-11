import React, { useEffect, useState } from 'react';
import type { UpstreamConfig } from '@oklychee/prism-shared';
import { api } from '../../../api';
import { KeyGeneratorModal } from '../../../components/KeyGeneratorModal';

export const CandidateKeyGeneratorPage: React.FC = () => {
  const [upstreams, setUpstreams] = useState<UpstreamConfig[]>([]);

  useEffect(() => {
    async function loadUpstreams() {
      const fetched = await api.getUpstreams();
      setUpstreams(fetched || []);
    }
    loadUpstreams();
  }, []);

  return <KeyGeneratorModal upstreams={upstreams} />;
};
