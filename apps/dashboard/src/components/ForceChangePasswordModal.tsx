import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, User, KeyRound, ArrowRight } from 'lucide-react';
import { DEFAULT_ADMIN_USERNAME } from '@oklychee/prism-shared';
import { api } from '../api';

interface ForceChangePasswordModalProps {
  onSuccess: () => void;
}

export const ForceChangePasswordModal: React.FC<ForceChangePasswordModalProps> = ({ onSuccess }) => {
  const { t } = useTranslation();

  const [username, setUsername] = useState(DEFAULT_ADMIN_USERNAME);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

    if (newPassword !== confirmPassword) {
      setErrorMsg(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await api.saveSettings({
        admin_username: username.trim() || DEFAULT_ADMIN_USERNAME,
        admin_password: newPassword,
      });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-color-bg-card border border-theme-border rounded-3xl p-8 relative overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Warning Icon & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-color-text-main">
            {t('auth.mustChangePasswordTitle')}
          </h2>
          <p className="text-xs text-color-text-muted mt-2 leading-relaxed">
            {t('auth.mustChangePasswordSubtitle')}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-primary-red/10 border border-primary-red/30 text-primary-red text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Optional Admin Username Update */}
          <div>
            <label className="block text-xs font-medium text-color-text-muted mb-1">
              {t('auth.username')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-color-text-muted">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('auth.usernamePlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-color-bg-dark border border-theme-border rounded-xl text-sm focus:outline-none focus:border-primary-red text-color-text-main"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-medium text-color-text-muted mb-1">
              {t('auth.newPassword')} <span className="text-primary-red">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-color-text-muted">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('auth.newPasswordPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-color-bg-dark border border-theme-border rounded-xl text-sm focus:outline-none focus:border-primary-red text-color-text-main"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-medium text-color-text-muted mb-1">
              {t('auth.confirmPassword')} <span className="text-primary-red">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-color-text-muted">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-color-bg-dark border border-theme-border rounded-xl text-sm focus:outline-none focus:border-primary-red text-color-text-main"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-primary-red hover:bg-primary-red/90 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? t('common.loading') : t('auth.updatePasswordBtn')}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};
