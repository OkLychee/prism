import type { RequestLog } from '@oklychee/prism-shared';
import { API_BASE, customFetch } from './client';

export interface GetLogsOptions {
  keyId?: string;
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
}

export interface GetLogsResult {
  logs: RequestLog[];
  hasMore: boolean;
  limit: number;
  offset: number;
}

export const logsApi = {
  // Fetch request interaction logs with optional pagination
  async getLogs(options?: GetLogsOptions | string): Promise<RequestLog[]> {
    try {
      let url = `${API_BASE}/logs`;
      const params = new URLSearchParams();

      if (typeof options === 'string') {
        if (options) params.append('key_id', options);
      } else if (options) {
        if (options.keyId) params.append('key_id', options.keyId);
        if (options.limit !== undefined) params.append('limit', options.limit.toString());
        if (options.offset !== undefined) params.append('offset', options.offset.toString());
        if (options.order) params.append('order', options.order);
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const res = await customFetch(url);
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.error('API getLogs error:', err);
      return [];
    }
  },

  async getLogsPaginated(options?: GetLogsOptions): Promise<GetLogsResult> {
    try {
      let url = `${API_BASE}/logs`;
      const params = new URLSearchParams();

      if (options?.keyId) params.append('key_id', options.keyId);
      if (options?.limit !== undefined) params.append('limit', options.limit.toString());
      if (options?.offset !== undefined) params.append('offset', options.offset.toString());
      if (options?.order) params.append('order', options.order);

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const res = await customFetch(url);
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      return {
        logs: data.data || [],
        hasMore: data.hasMore !== undefined ? !!data.hasMore : !!data.has_more,
        limit: data.limit || 50,
        offset: data.offset || 0,
      };
    } catch (err) {
      console.error('API getLogsPaginated error:', err);
      return { logs: [], hasMore: false, limit: 50, offset: 0 };
    }
  },
  async getLogDetail(id: string): Promise<RequestLog | null> {
    try {
      const res = await customFetch(`${API_BASE}/logs/${id}/detail`);
      if (!res.ok) throw new Error('Failed to fetch log detail');
      const data = await res.json();
      return data.data || null;
    } catch (err) {
      console.error('API getLogDetail error:', err);
      return null;
    }
  },
};

