import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { reconcileAllCardNotifications } from './scheduler';
import { requestNotificationPermissions } from './setup';

/** Re-schedules every card's due-date reminders on cold start and whenever the app returns to the
 * foreground — the mandatory reminder can't rely on background execution to stay accurate. */
export function useNotificationReconciliation() {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    void requestNotificationPermissions().then((granted) => {
      if (granted) void reconcileAllCardNotifications();
    });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const isForegrounding = appState.current !== 'active' && nextState === 'active';
      if (isForegrounding) {
        void reconcileAllCardNotifications();
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, []);
}
