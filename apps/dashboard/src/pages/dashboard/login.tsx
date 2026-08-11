import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Lock, User, KeyRound, ShieldCheck, ArrowRight, Globe, Check } from 'lucide-react';
import { api } from '../../api';

export const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLangOpen, setIsLangOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `${t('auth.title')} - Prism`;
  }, [t, i18n.language]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('prism_lang', lang);
    } catch (e) {}
    setIsLangOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      await api.login({ username, password });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-color-bg-dark text-color-text-main flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Top Right Language Switcher */}
      <div className="absolute top-6 right-6 z-20" ref={langRef}>
        <button
          onClick={() => setIsLangOpen(!isLangOpen)}
          className="p-2.5 rounded-xl bg-color-bg-card border border-theme-border text-color-text-muted hover:text-color-text-main transition flex items-center space-x-2 cursor-pointer text-xs"
          title="Switch Language"
        >
          <Globe className="w-4 h-4 text-primary-red" />
          <span>{i18n.language === 'zh-CN' ? '简体中文' : 'English'}</span>
        </button>

        {isLangOpen && (
          <div className="absolute right-0 mt-2 w-32 bg-color-bg-card border border-theme-border rounded-xl z-50 py-1 space-y-0.5 shadow-xl">
            <button
              onClick={() => changeLanguage('zh-CN')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs transition cursor-pointer ${
                i18n.language === 'zh-CN'
                  ? 'bg-primary-red-muted text-primary-red font-semibold'
                  : 'text-color-text-muted hover:bg-color-bg-dark'
              }`}
            >
              <span>简体中文</span>
              {i18n.language === 'zh-CN' && <Check className="w-3 h-3 text-primary-red" />}
            </button>

            <button
              onClick={() => changeLanguage('en-US')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs transition cursor-pointer ${
                i18n.language === 'en-US'
                  ? 'bg-primary-red-muted text-primary-red font-semibold'
                  : 'text-color-text-muted hover:bg-color-bg-dark'
              }`}
            >
              <span>English</span>
              {i18n.language === 'en-US' && <Check className="w-3 h-3 text-primary-red" />}
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-md bg-color-bg-card border border-theme-border rounded-3xl p-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-red-muted text-primary-red border border-primary-red/30 mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-color-text-main">
            {t('auth.title')}
          </h1>
          <p className="text-xs text-color-text-muted mt-2 leading-relaxed">
            {t('auth.subtitle')}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-primary-red/10 border border-primary-red/30 text-primary-red text-xs font-medium flex items-center space-x-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-color-text-muted mb-1.5">
              {t('auth.username')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-color-text-muted">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('auth.usernamePlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-color-bg-dark border border-theme-border rounded-xl text-sm focus:outline-none focus:border-primary-red text-color-text-main transition-colors placeholder:text-color-text-muted/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-color-text-muted mb-1.5">
              {t('auth.password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-color-text-muted">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-color-bg-dark border border-theme-border rounded-xl text-sm focus:outline-none focus:border-primary-red text-color-text-main transition-colors placeholder:text-color-text-muted/60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary-red hover:bg-primary-red/90 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? t('common.loading') : t('auth.loginBtn')}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};
