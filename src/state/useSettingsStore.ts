import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { secureStoreStorage } from '@/lib/secureStoreStorage';

export type Language = 'ar' | 'en';
export type CalendarSystem = 'gregorian' | 'hijri';
export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsState {
  userName: string;
  language: Language;
  calendar: CalendarSystem;
  themeMode: ThemeMode;
  hasOnboarded: boolean;
  /** Whether the unlock gate is required at all — PIN is set up as soon as this turns on. */
  appLockEnabled: boolean;
  /** Only meaningful when appLockEnabled — lets a set-up PIN holder skip straight to biometrics. */
  biometricEnabled: boolean;
  setUserName: (name: string) => void;
  setLanguage: (language: Language) => void;
  setCalendar: (calendar: CalendarSystem) => void;
  setThemeMode: (mode: ThemeMode) => void;
  completeOnboarding: () => void;
  setAppLockEnabled: (enabled: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      userName: '',
      language: 'ar',
      calendar: 'gregorian',
      themeMode: 'system',
      hasOnboarded: false,
      appLockEnabled: false,
      biometricEnabled: false,
      setUserName: (userName) => set({ userName }),
      setLanguage: (language) => set({ language }),
      setCalendar: (calendar) => set({ calendar }),
      setThemeMode: (themeMode) => set({ themeMode }),
      completeOnboarding: () => set({ hasOnboarded: true }),
      setAppLockEnabled: (appLockEnabled) => set({ appLockEnabled }),
      setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),
    }),
    {
      name: 'expense-tracker.settings',
      storage: createJSONStorage(() => secureStoreStorage),
    }
  )
);
