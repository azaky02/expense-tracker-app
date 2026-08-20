import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useLockStore } from '@/state/useLockStore';
import { useSettingsStore } from '@/state/useSettingsStore';

/** Locks the app the moment it backgrounds (no grace period, per Phase 1 scope) whenever
 * app-lock is enabled, and requires unlock again at every cold start. */
export function useAutoLock() {
  const appLockEnabled = useSettingsStore((s) => s.appLockEnabled);
  const lock = useLockStore((s) => s.lock);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (appLockEnabled) lock();
    // Only re-run when the setting itself changes (e.g. user just enabled it) — not on every lock().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appLockEnabled]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const isBackgrounding = appState.current === 'active' && nextState !== 'active';
      if (isBackgrounding && appLockEnabled) {
        lock();
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [appLockEnabled, lock]);
}
