import { API_BASE, customFetch } from './client';
import type { SystemSettingsResponse, SystemSettingsPayload } from '@oklychee/prism-shared';

export const settingsApi = {
  // Fetch system settings
  async getSettings(): Promise<SystemSettingsResponse> {
    try {
      const res = await customFetch(`${API_BASE}/settings`);
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      return data.data || {};
    } catch (err) {
      console.error('API getSettings error:', err);
      return {};
    }
  },

  // Save system settings
  async saveSettings(settings: SystemSettingsPayload): Promise<void> {
    const res = await customFetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to save settings');
    }
  },
};

