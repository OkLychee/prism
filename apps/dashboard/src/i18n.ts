import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

// Auto-detect browser language: 'zh-*' -> 'zh-CN', others -> 'en-US'
export function detectInitialLanguage(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('prism_lang');
    if (saved === 'zh-CN' || saved === 'en-US') {
      return saved;
    }
    const navLang = (navigator.language || navigator.languages?.[0] || '').toLowerCase();
    if (navLang.startsWith('zh')) {
      return 'zh-CN';
    }
  }
  return 'en-US';
}

const resources = {
  'zh-CN': { translation: zhCN },
  'en-US': { translation: enUS }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectInitialLanguage(),
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
