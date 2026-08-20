import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar.json';
import en from './locales/en.json';

export const resources = {
  ar: { translation: ar },
  en: { translation: en },
} as const;

// Actual startup language (device locale vs. persisted user choice) is resolved by
// initI18n() in app/_layout.tsx via useSettingsStore, which runs before RTL layout is decided.
void i18n.use(initReactI18next).init({
  resources,
  lng: 'ar',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
