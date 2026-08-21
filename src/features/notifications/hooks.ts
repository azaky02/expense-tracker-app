import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { applyLogReminderPreference, reconcileAllAccountNotifications, reconcileAllRecurringRuleNotifications } from '@/lib/notifications/scheduler';

import { getNotificationPreference, setNotificationPreference } from './api';

const keys = {
  preference: (key: string) => ['notification-preferences', key] as const,
};

export function useNotificationPreference(key: string) {
  return useQuery({ queryKey: keys.preference(key), queryFn: () => getNotificationPreference(key) });
}

export function useSetExtraDueDateReminders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (daysBefore: number[]) => {
      await setNotificationPreference('extraDueDateReminders', daysBefore.length > 0, { daysBefore });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.preference('extraDueDateReminders') });
      await reconcileAllAccountNotifications();
    },
  });
}

export function useSetRecurringBillReminders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      await setNotificationPreference('recurringBillReminders', enabled, { daysBefore: 1 });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.preference('recurringBillReminders') });
      await reconcileAllRecurringRuleNotifications();
    },
  });
}

export function useSetDailyLogReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ enabled, hour }: { enabled: boolean; hour: number }) => {
      await setNotificationPreference('dailyLogReminder', enabled, { hour });
      await applyLogReminderPreference(enabled, hour);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.preference('dailyLogReminder') }),
  });
}
