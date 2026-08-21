import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { reconcileAllAccountNotifications, reconcileAllRecurringRuleNotifications } from './scheduler';
import { requestNotificationPermissions } from './setup';

async function reconcileAll(): Promise<void> {
  await reconcileAllAccountNotifications();
  await reconcileAllRecurringRuleNotifications();
}

/** Re-schedules every card's due-date reminders and recurring-bill reminders on cold start and
 * whenever the app returns to the foreground — mandatory reminders can't rely on background
 * execution to stay accurate. */
export function useNotificationReconciliation() {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    void requestNotificationPermissions().then((granted) => {
      if (granted) void reconcileAll();
    });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const isForegrounding = appState.current !== 'active' && nextState === 'active';
      if (isForegrounding) {
        void reconcileAll();
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, []);
}
