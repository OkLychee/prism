import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Home, Sun, Moon, Laptop, Check, Menu, LogOut } from 'lucide-react';
import { api } from '../../api';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import type { SidebarGroup, SidebarNavItem } from './Sidebar';

export type { SidebarGroup, SidebarNavItem };

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export type ThemeMode = 'system' | 'light' | 'dark';

interface DashboardLayoutProps {
  children: React.ReactNode;
  navGroups?: SidebarGroup[];
  breadcrumbs?: BreadcrumbItem[];
  currentTitle?: string;
  currentDescription?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navGroups = [],
  breadcrumbs = [{ label: 'Dashboard', href: '/dashboard' }],
  currentTitle,
  currentDescription,
}) => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await api.logout();
    navigate('/dashboard/login', { replace: true });
  };
  
  // Screen size detection
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  
  // Sidebar state: On mobile, defaults to completely hidden (drawer closed)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update browser tab document.title
  useEffect(() => {
    if (currentTitle) {
      document.title = `${currentTitle} - Prism`;
    } else {
      document.title = 'Prism';
    }
  }, [currentTitle]);

  // Dropdown States
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prism_theme_mode');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    }
    return 'system';
  });

  const langRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Apply theme to document element & subscribe to system preference changes
  useEffect(() => {
    const applyTheme = (mode: ThemeMode) => {
      const root = document.documentElement;
      if (mode === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else if (mode === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
      } else {
        // System preference
        const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemIsDark) {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.add('light');
          root.classList.remove('dark');
        }
      }
    };

    applyTheme(themeMode);

    // Listen for system theme changes if themeMode is system
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  // Handle click outside to close dropdowns
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
    } catch (e) {}
    setIsLangOpen(false);
  };

  const changeTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      localStorage.setItem('prism_theme_mode', mode);
    } catch (e) {}
    setIsThemeOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-color-bg-main text-color-text-main font-sans relative">
      {/* 1. Desktop Sidebar (Hidden on mobile) */}
      {!isMobile && (
        <Sidebar
          groups={navGroups}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      )}

      {/* 2. Mobile Drawer Sidebar (Overlaid Drawer) */}
      {isMobile && (
        <>
          {/* Mobile Drawer Backdrop */}
          {isMobileDrawerOpen && (
            <div
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 transition-opacity"
            />
          )}

          {/* Mobile Drawer Sliding Content */}
          <div
            className={`fixed top-0 left-0 bottom-0 z-50 transition-transform duration-300 ease-in-out ${
              isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <Sidebar
              groups={navGroups}
              isCollapsed={false}
              onToggleCollapse={() => {}}
              isMobile={true}
              onMobileClose={() => setIsMobileDrawerOpen(false)}
            />
          </div>
        </>
      )}

      {/* 3. Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-color-bg-main">
        {/* Top Header & Breadcrumb Bar (Fixed Height) */}
        <header className="h-[60px] px-4 sm:px-6 border-b border-theme-border bg-color-bg-sidebar flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            {/* Mobile Drawer Toggle Button */}
            {isMobile && (
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="p-2 rounded-xl bg-color-bg-card border border-theme-border hover:border-primary-red/40 text-color-text-muted hover:text-color-text-main transition flex items-center justify-center cursor-pointer"
                title="Open Navigation"
              >
                <Menu className="w-4 h-4 text-color-text-main" />
              </button>
            )}

            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-xs text-color-text-muted">
              <Home className="w-3.5 h-3.5 text-color-text-muted" />
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span className="text-color-text-muted opacity-50">/</span>
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className="hover:text-color-text-main transition font-medium text-color-text-muted"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-color-text-main font-semibold">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Right Utilities (Theme & Language Icon Dropdown Buttons & Logout) */}
          <div className="flex items-center space-x-2">
            {/* Theme Selector Dropdown Button */}
            <div className="relative" ref={themeRef}>
              <button
                onClick={() => setIsThemeOpen(!isThemeOpen)}
                className="p-2 rounded-xl bg-color-bg-card border border-theme-border hover:border-primary-red/40 text-color-text-muted hover:text-color-text-main transition flex items-center justify-center cursor-pointer"
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
                      <Sun className="w-3.5 h-3.5" />
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
                      <Moon className="w-3.5 h-3.5" />
                      <span>{t('nav.themeDark')}</span>
                    </div>
                    {themeMode === 'dark' && <Check className="w-3 h-3 text-primary-red" />}
                  </button>
                </div>
              )}
            </div>

            {/* Language Selector Dropdown Button */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="p-2 rounded-xl bg-color-bg-card border border-theme-border hover:border-primary-red/40 text-color-text-muted hover:text-color-text-main transition flex items-center justify-center cursor-pointer"
                title="Switch Language"
              >
                <Globe className="w-4 h-4 text-primary-red" />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-color-bg-sidebar border border-theme-border rounded-xl z-50 p-1 space-y-0.5 shadow-xl overflow-hidden">
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

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-color-bg-card border border-theme-border hover:border-primary-red/40 text-color-text-muted hover:text-primary-red transition flex items-center justify-center cursor-pointer"
              title={t('auth.logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content Body (Scrollable Container) */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Optional Page Title Header */}
            {(currentTitle || currentDescription) && (
              <div className="border-b border-theme-border pb-4">
                {currentTitle && <h1 className="text-xl font-bold text-color-text-main">{currentTitle}</h1>}
                {currentDescription && (
                  <p className="text-xs text-color-text-muted mt-1">{currentDescription}</p>
                )}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
