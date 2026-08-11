import type { UpstreamConfig } from '@oklychee/prism-shared';
import { API_BASE, customFetch } from './client';

export const upstreamsApi = {
  // Fetch upstream configs
  async getUpstreams(): Promise<UpstreamConfig[]> {
    try {
      const res = await customFetch(`${API_BASE}/upstreams`);
      if (!res.ok) throw new Error('Failed to fetch upstreams');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.error('API getUpstreams error:', err);
      return [];
    }
  },

  // Create upstream config
  async createUpstream(payload: Partial<UpstreamConfig>): Promise<UpstreamConfig> {
    const res = await customFetch(`${API_BASE}/upstreams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create upstream');
    }
    const data = await res.json();
    return data.data;
  },

  // Update upstream config
  async updateUpstream(id: string, payload: Partial<UpstreamConfig>): Promise<void> {
    const res = await customFetch(`${API_BASE}/upstreams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update upstream');
    }
  },

  // Delete upstream config
  async deleteUpstream(id: string): Promise<void> {
    const res = await customFetch(`${API_BASE}/upstreams/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete upstream');
    }
  },
};

