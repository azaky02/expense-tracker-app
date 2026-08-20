import { I18nManager } from 'react-native';
import RNRestart from 'react-native-restart';

import i18n from '@/i18n';
import type { Language } from '@/state/useSettingsStore';

const RTL_LANGUAGES: Language[] = ['ar'];

function isRtlLanguage(language: Language): boolean {
  return RTL_LANGUAGES.includes(language);
}

/** Call once at boot with the persisted/default language, before any UI renders — no restart needed. */
export function syncRtlOnBoot(language: Language): void {
  const shouldBeRtl = isRtlLanguage(language);
  i18n.changeLanguage(language);
  if (I18nManager.isRTL !== shouldBeRtl) {
    I18nManager.allowRTL(shouldBeRtl);
    I18nManager.forceRTL(shouldBeRtl);
  }
}

/**
 * Call from Settings when the user changes language after boot. RTL direction only takes effect
 * after a full JS reload, so this restarts the app immediately — call it after the user confirms
 * a "the app will restart" dialog.
 *
 * The short delay before restarting isn't cosmetic: useSettingsStore is zustand `persist`, which
 * writes to expo-secure-store asynchronously after every `set()`. Any state set in the same tick
 * as this call (e.g. onboarding's setUserName/setCalendar/completeOnboarding) needs a moment to
 * actually reach storage, or a restart racing that write would lose it.
 */
export function applyLanguageAndRestart(language: Language): void {
  const shouldBeRtl = isRtlLanguage(language);
  i18n.changeLanguage(language);
  const rtlChanged = I18nManager.isRTL !== shouldBeRtl;
  I18nManager.allowRTL(shouldBeRtl);
  I18nManager.forceRTL(shouldBeRtl);
  if (rtlChanged) {
    setTimeout(() => RNRestart.restart(), 250);
  }
}
