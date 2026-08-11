import type { InterviewKey } from '@oklychee/prism-shared';
import { API_BASE, customFetch } from './client';

export const keysApi = {
  // Fetch all candidate interview keys
  async getKeys(): Promise<InterviewKey[]> {
    try {
      const res = await customFetch(`${API_BASE}/keys`);
      if (!res.ok) throw new Error('Failed to fetch keys');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.error('API getKeys error:', err);
      return [];
    }
  },

  // Create a new interview key
  async createKey(payload: Partial<InterviewKey>): Promise<InterviewKey> {
    const res = await customFetch(`${API_BASE}/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create key');
    }
    const data = await res.json();
    return data.data;
  },

  // Update interview key status (toggle enable/disable)
  async updateKeyStatus(id: string, status: 'active' | 'revoked'): Promise<void> {
    const res = await customFetch(`${API_BASE}/keys/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update key status');
    }
  },

  // Update candidate interview key details
  async updateKey(id: string, payload: Partial<InterviewKey>): Promise<InterviewKey> {
    const res = await customFetch(`${API_BASE}/keys/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update key');
    }
    const data = await res.json();
    return data.data;
  },

  // Delete interview key
  async deleteKey(id: string): Promise<void> {
    const res = await customFetch(`${API_BASE}/keys/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete key');
    }
  },
};

