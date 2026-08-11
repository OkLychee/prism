import { keysApi } from './keys';
import { logsApi } from './logs';
import { upstreamsApi } from './upstreams';
import { settingsApi } from './settings';
import { authApi } from './auth';

export * from './client';
export * from './keys';
export * from './logs';
export * from './upstreams';
export * from './settings';
export * from './auth';

// Export unified `api` object to preserve backward compatibility across components
export const api = {
  login: authApi.login,
  checkAuth: authApi.check,
  logout: authApi.logout,

  getKeys: keysApi.getKeys,
  createKey: keysApi.createKey,
  updateKey: keysApi.updateKey,
  updateKeyStatus: keysApi.updateKeyStatus,
  deleteKey: keysApi.deleteKey,

  getLogs: logsApi.getLogs,
  getLogsPaginated: logsApi.getLogsPaginated,
  getLogDetail: logsApi.getLogDetail,

  getUpstreams: upstreamsApi.getUpstreams,
  createUpstream: upstreamsApi.createUpstream,
  updateUpstream: upstreamsApi.updateUpstream,
  deleteUpstream: upstreamsApi.deleteUpstream,

  getSettings: settingsApi.getSettings,
  saveSettings: settingsApi.saveSettings,
};

