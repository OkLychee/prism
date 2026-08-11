import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Sun,
  Moon,
  Laptop,
  Check,
  Cpu,
  ShieldCheck,
  Layers,
  Clock,
  FileText,
  Boxes,
} from 'lucide-react';
import type { ThemeMode } from '../components/layout';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();

  // Set Document Title with i18n
  useEffect(() => {
    document.title = t('landing.pageTitle');
  }, [t, i18n.language]);

  // Theme Mode State
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prism_theme_mode');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    }
    return 'system';
  });

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Apply Theme Mode effect
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    } else if (themeMode === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [themeMode]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('prism_lang', lang);
    } catch {}
    setIsLangOpen(false);
  };

  const changeTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      localStorage.setItem('prism_theme_mode', mode);
    } catch {}
    setIsThemeOpen(false);
  };

  const featureItems = [
    {
      icon: <Cpu className="w-5 h-5 text-color-text-main" />,
      title: t('landing.featureWorkersAi'),
      desc: t('landing.featureWorkersAiDesc'),
    },
    {
      icon: <Layers className="w-5 h-5 text-color-text-main" />,
      title: t('landing.featureAiGateway'),
      desc: t('landing.featureAiGatewayDesc'),
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-color-text-main" />,
      title: t('landing.featureByok'),
      desc: t('landing.featureByokDesc'),
    },
    {
      icon: <Boxes className="w-5 h-5 text-color-text-main" />,
      title: t('landing.featureProtocol'),
      desc: t('landing.featureProtocolDesc'),
    },
    {
      icon: <Clock className="w-5 h-5 text-color-text-main" />,
      title: t('landing.featureQuota'),
      desc: t('landing.featureQuotaDesc'),
    },
    {
      icon: <FileText className="w-5 h-5 text-color-text-main" />,
      title: t('landing.featureTimeline'),
      desc: t('landing.featureTimelineDesc'),
    },
  ];

  return (
    <div className="min-h-screen bg-color-bg-main text-color-text-main font-sans transition-colors duration-200">
      {/* 1. Header Navigation Bar */}
      <header className="h-[64px] border-b border-theme-border bg-color-bg-sidebar/80 backdrop-blur-md sticky top-0 z-50 px-6 sm:px-12 flex items-center justify-between">
        {/* Left Brand Logo + Prism */}
        <a href="/" className="flex items-center space-x-3 group">
          <img
            src="/logo.png"
            alt="Prism Logo"
            className="w-8 h-8 rounded-lg object-cover group-hover:scale-105 transition"
          />
          <span className="font-bold text-lg tracking-wide text-color-text-main">
            Prism
          </span>
        </a>

        {/* Right Action Utilities (Language, Theme, GitHub) */}
        {/* Right Action Utilities (Language, Theme, GitHub) */}
        <div className="flex items-center space-x-3">
          {/* GitHub Repo Button */}
          <a
            href="https://github.com/OkLychee/prism"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-color-bg-card border border-theme-border hover:border-primary-red text-color-text-muted hover:text-color-text-main transition flex items-center space-x-1.5 text-xs font-mono"
            title="GitHub Repository"
          >
            <GithubIcon className="w-4 h-4" />
            <span className="hidden sm:inline">OkLychee/prism</span>
          </a>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="p-2 rounded-xl bg-color-bg-card border border-theme-border hover:border-primary-red text-color-text-muted hover:text-color-text-main transition flex items-center justify-center cursor-pointer text-xs"
              title="Language"
            >
              <Globe className="w-4 h-4" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-color-bg-sidebar border border-theme-border rounded-xl z-50 p-1 space-y-0.5 shadow-xl overflow-hidden">
                <button
                  onClick={() => changeLanguage('zh-CN')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition cursor-pointer ${
                    i18n.language === 'zh-CN'
                      ? 'bg-primary-red-muted text-primary-red font-semibold'
                      : 'text-color-text-muted hover:bg-color-bg-card'
                  }`}
                >
                  <span>简体中文</span>
                  {i18n.language === 'zh-CN' && <Check className="w-3 h-3 text-primary-red" />}
                </button>
                <button
                  onClick={() => changeLanguage('en-US')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition cursor-pointer ${
                    i18n.language === 'en-US'
                      ? 'bg-primary-red-muted text-primary-red font-semibold'
                      : 'text-color-text-muted hover:bg-color-bg-card'
                  }`}
                >
                  <span>English</span>
                  {i18n.language === 'en-US' && <Check className="w-3 h-3 text-primary-red" />}
                </button>
              </div>
            )}
          </div>

          {/* Theme Mode Selector Dropdown */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setIsThemeOpen(!isThemeOpen)}
              className="p-2 rounded-xl bg-color-bg-card border border-theme-border hover:border-primary-red text-color-text-muted hover:text-color-text-main transition flex items-center justify-center cursor-pointer text-xs"
              title="Toggle Theme"
            >
              {themeMode === 'light' && <Sun className="w-4 h-4 text-amber-400" />}
              {themeMode === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
              {themeMode === 'system' && <Laptop className="w-4 h-4 text-primary-red" />}
            </button>

            {isThemeOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-color-bg-sidebar border border-theme-border rounded-xl z-50 p-1 space-y-0.5 shadow-xl overflow-hidden">
                <button
                  onClick={() => changeTheme('system')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition cursor-pointer ${
                    themeMode === 'system'
                      ? 'bg-primary-red-muted text-primary-red font-semibold'
                      : 'text-color-text-muted hover:bg-color-bg-card'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>{t('nav.themeSystem')}</span>
                  </div>
                  {themeMode === 'system' && <Check className="w-3 h-3 text-primary-red" />}
                </button>
                <button
                  onClick={() => changeTheme('light')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition cursor-pointer ${
                    themeMode === 'light'
                      ? 'bg-primary-red-muted text-primary-red font-semibold'
                      : 'text-color-text-muted hover:bg-color-bg-card'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('nav.themeLight')}</span>
                  </div>
                  {themeMode === 'light' && <Check className="w-3 h-3 text-primary-red" />}
                </button>
                <button
                  onClick={() => changeTheme('dark')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition cursor-pointer ${
                    themeMode === 'dark'
                      ? 'bg-primary-red-muted text-primary-red font-semibold'
                      : 'text-color-text-muted hover:bg-color-bg-card'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t('nav.themeDark')}</span>
                  </div>
                  {themeMode === 'dark' && <Check className="w-3 h-3 text-primary-red" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Spacious Layout with Tech Stickers at Bottom) */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-32 flex flex-col justify-between min-h-[calc(88vh-64px)]">
        <div className="max-w-2xl space-y-6 text-left">
          {/* Large Title */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-color-text-main leading-tight">
            Prism
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-color-text-muted leading-relaxed">
            {t('landing.heroSubtitle')}
          </p>

          {/* Action Buttons (Pill / Full Rounded Style) */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <a
              href="/dashboard"
              className="px-7 py-3.5 bg-color-text-main text-color-bg-main hover:opacity-90 font-bold rounded-full text-sm transition flex items-center space-x-2 cursor-pointer"
            >
              <span>{t('landing.enterDashboard')}</span>
            </a>

            <a
              href="https://github.com/OkLychee/prism"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3.5 bg-transparent hover:bg-color-bg-card text-color-text-main font-semibold rounded-full text-sm transition flex items-center space-x-2 cursor-pointer"
            >
              <GithubIcon className="w-4 h-4" />
              <span>{t('landing.githubRepo')}</span>
            </a>
          </div>
        </div>

        {/* Tech Stickers at the Bottom of Hero Section (Sink Style, Centered & Larger) */}
        <div className="pt-16 sm:pt-24 flex flex-wrap items-center justify-center gap-10 sm:gap-16">
          <img
            src="/images/Cloudflare.png"
            alt="Cloudflare Sticker"
            className="h-28 sm:h-36 w-auto object-contain"
          />
          <img
            src="/images/TypeScript.png"
            alt="TypeScript Sticker"
            className="h-28 sm:h-36 w-auto object-contain"
          />
        </div>
      </section>

      {/* 3. Features Section */}
      <section className="border-t border-theme-border bg-color-bg-sidebar/50 py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-color-text-main tracking-tight">
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-sm text-color-text-muted">
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          {/* 6 Grid Feature Cards (Hover border color and title color changed to primary-red) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featureItems.map((item, idx) => (
              <div
                key={idx}
                className="p-6 bg-color-bg-card rounded-2xl border border-theme-border hover:border-primary-red group transition duration-200 space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-color-bg-sidebar border border-theme-border flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold text-color-text-main group-hover:text-primary-red transition">{item.title}</h3>
                <p className="text-xs text-color-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Footer CTA & Copyright */}
      <footer className="border-t border-theme-border py-16 px-6 bg-color-bg-sidebar">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Large Deploy Box Card (Styled like feature cards with hover effect) */}
          <div className="p-10 rounded-3xl bg-color-bg-card border border-theme-border hover:border-primary-red group transition duration-200 text-center space-y-6">
            <h3 className="text-3xl font-extrabold tracking-tight text-color-text-main group-hover:text-primary-red transition duration-200">
              {t('landing.deployTitle')}
            </h3>
            <p className="text-xs font-medium text-color-text-muted max-w-md mx-auto">
              {t('landing.deploySubtitle')}
            </p>
            <div className="pt-2">
              <a
                href="https://github.com/OkLychee/prism"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-red text-white font-bold text-xs rounded-full hover:opacity-90 transition cursor-pointer"
              >
                <GithubIcon className="w-4 h-4" />
                <span>{t('landing.startDeploy')}</span>
              </a>
            </div>
          </div>

          {/* Footer Bottom Bar */}
          <div className="pt-6 border-t border-theme-border flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-color-text-muted">
            {/* Left Column: Copyright & GitHub icon */}
            <div className="flex items-center space-x-3">
              <a
                href="https://prism.oklychee.dev"
                className="font-bold text-color-text-main hover:text-primary-red transition"
              >
                Prism
              </a>
              <span>© {new Date().getFullYear()}</span>
              <a
                href="https://github.com/OkLychee/prism"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-color-text-main transition ml-1"
                title="GitHub Repository"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
            </div>

            {/* Right Column: Powered By OKLYCHEE Logo & Greeting */}
            <div className="flex flex-col items-center sm:items-end space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs text-color-text-muted">Powered By</span>
                <a
                  href="https://oklychee.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center hover:opacity-85 transition"
                >
                  <img
                    src="/images/oklychee-logo.png"
                    alt="OKLYCHEE"
                    className="h-5 w-auto object-contain"
                  />
                </a>
              </div>
              <span className="text-[11px] text-color-text-muted/70 font-mono tracking-tight">
                {t('landing.greeting')}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
