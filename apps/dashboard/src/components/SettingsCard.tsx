import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Check, ShieldCheck, ShieldAlert, Trash2, User, Lock, Clock, Database, HardDrive } from 'lucide-react';
import { DEFAULT_ADMIN_USERNAME } from '@oklychee/prism-shared';
import { api } from '../api';
import { Button, Badge } from './ui';

export const SettingsCard: React.FC = () => {
  const { t } = useTranslation();
  const [cfAccountId, setCfAccountId] = useState('');
  const [cfGatewayId, setCfGatewayId] = useState('default');
  
  // Security State: Never receives raw token from backend
  const [isTokenConfigured, setIsTokenConfigured] = useState(false);
  const [cfApiTokenInput, setCfApiTokenInput] = useState('');

  // Admin Account & Password Change States
  const [adminUsername, setAdminUsername] = useState(DEFAULT_ADMIN_USERNAME);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Timezone Preference State
  const [timezoneMode, setTimezoneMode] = useState<'UTC' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prism_timezone_mode');
      if (saved === 'system') return 'system';
    }
    return 'UTC';
  });

  // Log Storage Engine State ('d1' | 'r2')
  const [logStorageEngine, setLogStorageEngine] = useState<'d1' | 'r2'>('d1');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = async () => {
    const settings = await api.getSettings();
    if (settings.cf_account_id !== undefined) setCfAccountId(settings.cf_account_id);
    if (settings.cf_gateway_id !== undefined) setCfGatewayId(settings.cf_gateway_id);
    if (settings.admin_username) setAdminUsername(settings.admin_username);
    if (settings.timezone_mode) {
      setTimezoneMode(settings.timezone_mode);
      localStorage.setItem('prism_timezone_mode', settings.timezone_mode);
      window.dispatchEvent(new Event('prism_timezone_changed'));
    }
    if (settings.log_storage_engine) {
      setLogStorageEngine(settings.log_storage_engine);
    }
    setIsTokenConfigured(Boolean(settings.cf_api_token_configured));
    setCfApiTokenInput(''); // Reset user input after load
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword || confirmPassword) {
      if (!oldPassword) {
        setErrorMsg(t('settings.oldPasswordPlaceholder'));
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg(t('auth.passwordMismatch'));
        return;
      }
    }

    setIsSaving(true);
    try {
      localStorage.setItem('prism_timezone_mode', timezoneMode);
      window.dispatchEvent(new Event('prism_timezone_changed'));

      const payload: {
        cf_account_id: string;
        cf_gateway_id: string;
        cf_api_token?: string;
        admin_username?: string;
        admin_password?: string;
        old_admin_password?: string;
        timezone_mode?: 'UTC' | 'system';
        log_storage_engine?: 'd1' | 'r2';
      } = {
        cf_account_id: cfAccountId.trim(),
        cf_gateway_id: cfGatewayId.trim() || 'default',
        admin_username: adminUsername.trim() || DEFAULT_ADMIN_USERNAME,
        timezone_mode: timezoneMode,
        log_storage_engine: logStorageEngine,
      };

      if (cfApiTokenInput.trim().length > 0) {
        payload.cf_api_token = cfApiTokenInput.trim();
      }

      if (newPassword) {
        payload.admin_password = newPassword;
        payload.old_admin_password = oldPassword;
      }

      await api.saveSettings(payload);
      setSaved(true);
      await fetchSettings();
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearToken = async () => {
    if (!window.confirm(t('settings.clearToken') + '?')) return;
    setIsSaving(true);
    try {
      await api.saveSettings({
        cf_account_id: cfAccountId.trim(),
        cf_gateway_id: cfGatewayId.trim() || 'default',
        cf_api_token: '', // Sending empty string explicitly clears the token in DB
      });
      await fetchSettings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to clear token');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-color-bg-sidebar p-6 rounded-2xl border border-theme-border space-y-6">
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-primary-red/10 border border-primary-red/30 text-primary-red text-xs font-medium flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Admin Credentials Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-color-text-main uppercase tracking-wider flex items-center space-x-2">
            <User className="w-4 h-4 text-primary-red" />
            <span>{t('settings.adminSection')}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Admin Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-color-text-muted">
                {t('settings.username')}
              </label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder={t('settings.usernamePlaceholder')}
                className="w-full px-4 py-2.5 bg-color-bg-card border border-theme-border rounded-xl text-color-text-main text-xs focus:outline-none focus:border-primary-red transition"
              />
            </div>

            {/* Old Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-color-text-muted">
                {t('settings.oldPassword')}
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={t('settings.oldPasswordPlaceholder')}
                className="w-full px-4 py-2.5 bg-color-bg-card border border-theme-border rounded-xl text-color-text-main text-xs focus:outline-none focus:border-primary-red transition"
              />
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-color-text-muted">
                {t('settings.newPassword')}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('settings.newPasswordPlaceholder')}
                className="w-full px-4 py-2.5 bg-color-bg-card border border-theme-border rounded-xl text-color-text-main text-xs focus:outline-none focus:border-primary-red transition"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-color-text-muted">
                {t('settings.confirmPassword')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('settings.confirmPasswordPlaceholder')}
                className="w-full px-4 py-2.5 bg-color-bg-card border border-theme-border rounded-xl text-color-text-main text-xs focus:outline-none focus:border-primary-red transition"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Display & Timezone Preference */}
        <div className="space-y-4 pt-4 border-t border-theme-border">
          <h3 className="text-xs font-bold text-color-text-main uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-primary-red" />
            <span>{t('settings.displaySection')}</span>
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-medium text-color-text-muted">
              {t('settings.timezone')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setTimezoneMode('UTC')}
                className={`px-4 py-2.5 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                  timezoneMode === 'UTC'
                    ? 'bg-primary-red-muted border-primary-red text-primary-red font-semibold'
                    : 'bg-color-bg-card border-theme-border text-color-text-muted hover:border-color-text-muted'
                }`}
              >
                <span>{t('settings.timezoneUtc')}</span>
                {timezoneMode === 'UTC' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setTimezoneMode('system')}
                className={`px-4 py-2.5 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                  timezoneMode === 'system'
                    ? 'bg-primary-red-muted border-primary-red text-primary-red font-semibold'
                    : 'bg-color-bg-card border-theme-border text-color-text-muted hover:border-color-text-muted'
                }`}
              >
                <span>{t('settings.timezoneSystem')}</span>
                {timezoneMode === 'system' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Log Storage Engine Preference */}
        <div className="space-y-4 pt-4 border-t border-theme-border">
          <h3 className="text-xs font-bold text-color-text-main uppercase tracking-wider flex items-center space-x-2">
            <Database className="w-4 h-4 text-primary-red" />
            <span>{t('settings.storageSection')}</span>
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-medium text-color-text-muted">
              {t('settings.storageEngine')}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* D1 Storage Button */}
              <button
                type="button"
                onClick={() => setLogStorageEngine('d1')}
                className={`p-4 rounded-xl border text-xs text-left transition cursor-pointer flex items-start space-x-3 ${
                  logStorageEngine === 'd1'
                    ? 'bg-primary-red-muted border-primary-red text-primary-red font-semibold'
                    : 'bg-color-bg-card border-theme-border text-color-text-muted hover:border-color-text-muted'
                }`}
              >
                <Database className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>Cloudflare D1</span>
                    {logStorageEngine === 'd1' && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div className="text-[11px] text-color-text-muted font-normal">
                    {t('settings.storageD1')}
                  </div>
                </div>
              </button>

              {/* R2 Storage Button */}
              <button
                type="button"
                onClick={() => setLogStorageEngine('r2')}
                className={`p-4 rounded-xl border text-xs text-left transition cursor-pointer flex items-start space-x-3 ${
                  logStorageEngine === 'r2'
                    ? 'bg-primary-red-muted border-primary-red text-primary-red font-semibold'
                    : 'bg-color-bg-card border-theme-border text-color-text-muted hover:border-color-text-muted'
                }`}
              >
                <HardDrive className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>Cloudflare R2 Bucket</span>
                    {logStorageEngine === 'r2' && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div className="text-[11px] text-color-text-muted font-normal">
                    {t('settings.storageR2')}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Cloudflare AI Gateway Settings */}
        <div className="space-y-4 pt-4 border-t border-theme-border">
          <h3 className="text-xs font-bold text-color-text-main uppercase tracking-wider flex items-center space-x-2">
            <Lock className="w-4 h-4 text-primary-red" />
            <span>{t('settings.cfSection')}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cloudflare Account ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-color-text-muted">
                {t('settings.accountId')}
              </label>
              <input
                type="text"
                value={cfAccountId}
                onChange={(e) => setCfAccountId(e.target.value)}
                placeholder="e.g. 8a9b3c4d5e6f7a8b9c0d"
                className="w-full px-4 py-2.5 bg-color-bg-card border border-theme-border rounded-xl text-color-text-main text-xs font-mono placeholder-color-text-muted/50 focus:outline-none focus:border-primary-red transition"
              />
            </div>

            {/* AI Gateway Slug */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-color-text-muted">
                {t('settings.gatewayId')}
              </label>
              <input
                type="text"
                value={cfGatewayId}
                onChange={(e) => setCfGatewayId(e.target.value)}
                placeholder="default"
                className="w-full px-4 py-2.5 bg-color-bg-card border border-theme-border rounded-xl text-color-text-main text-xs font-mono placeholder-color-text-muted/50 focus:outline-none focus:border-primary-red transition"
              />
            </div>
          </div>

          {/* Cloudflare API Token (Sensitive Field) */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-color-text-muted flex items-center space-x-2">
                <span>{t('settings.apiToken')}</span>
              </label>

              {/* Token Status Badge & Clear Button */}
              <div className="flex items-center space-x-2">
                {isTokenConfigured ? (
                  <>
                    <Badge variant="green" icon={<ShieldCheck className="w-3 h-3" />}>
                      {t('settings.tokenConfigured')}
                    </Badge>
                    <button
                      type="button"
                      onClick={handleClearToken}
                      className="text-[11px] text-color-text-muted hover:text-rose-400 flex items-center space-x-1 transition cursor-pointer"
                      title={t('settings.clearToken')}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{t('settings.clearToken')}</span>
                    </button>
                  </>
                ) : (
                  <Badge variant="amber" icon={<ShieldAlert className="w-3 h-3" />}>
                    {t('settings.tokenNotConfigured')}
                  </Badge>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                type="password"
                value={cfApiTokenInput}
                onChange={(e) => setCfApiTokenInput(e.target.value)}
                placeholder={
                  isTokenConfigured
                    ? t('settings.tokenPlaceholderConfigured')
                    : t('settings.tokenPlaceholderEmpty')
                }
                className="w-full px-4 py-2.5 bg-color-bg-card border border-theme-border rounded-xl text-color-text-main text-xs font-mono placeholder-color-text-muted/60 focus:outline-none focus:border-primary-red transition"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            variant="primary"
            icon={saved ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            className="px-5 py-2.5 text-xs font-semibold cursor-pointer"
          >
            {saved ? t('settings.saved') : t('settings.save')}
          </Button>
        </div>
      </form>
    </div>
  );
};

