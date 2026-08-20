import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useNotificationPreference, useSetDailyLogReminder, useSetExtraDueDateReminders } from '@/features/notifications/hooks';
import { useAppTheme } from '@/theme/ThemeProvider';

const DAILY_REMINDER_HOUR = 20;

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const { data: extraPref } = useNotificationPreference('extraDueDateReminders');
  const { data: dailyPref } = useNotificationPreference('dailyLogReminder');
  const setExtraReminders = useSetExtraDueDateReminders();
  const setDailyReminder = useSetDailyLogReminder();

  const extraDays: number[] = useMemo(() => {
    if (!extraPref?.config) return [];
    return JSON.parse(extraPref.config).daysBefore ?? [];
  }, [extraPref]);

  function toggleExtraDay(day: number, enabled: boolean) {
    const next = enabled ? [...new Set([...extraDays, day])] : extraDays.filter((d) => d !== day);
    setExtraReminders.mutate(next);
  }

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <Box padding="l" flexDirection="row" alignItems="center">
        <Pressable onPress={() => router.back()} style={{ marginEnd: 12 }}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <Text variant="title">{t('settings.notifications')}</Text>
      </Box>

      <Box paddingHorizontal="l">
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
          <Box flex={1} marginEnd="m">
            <Text variant="body">{t('notifications.mandatoryDueDate')}</Text>
            <Text variant="caption">{t('notifications.alwaysOn')}</Text>
          </Box>
          <Switch value disabled />
        </Box>

        <Box flexDirection="row" alignItems="center" justifyContent="space-between" backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
          <Text variant="body" flex={1}>
            {t('notifications.extraSevenDays')}
          </Text>
          <Switch value={extraDays.includes(7)} onValueChange={(v) => toggleExtraDay(7, v)} />
        </Box>

        <Box flexDirection="row" alignItems="center" justifyContent="space-between" backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l">
          <Text variant="body" flex={1}>
            {t('notifications.extraOneDay')}
          </Text>
          <Switch value={extraDays.includes(1)} onValueChange={(v) => toggleExtraDay(1, v)} />
        </Box>

        <Box flexDirection="row" alignItems="center" justifyContent="space-between" backgroundColor="surfaceAlt" borderRadius="m" padding="m">
          <Text variant="body" flex={1}>
            {t('notifications.dailyLogReminder')}
          </Text>
          <Switch
            value={!!dailyPref?.isEnabled}
            onValueChange={(enabled) => setDailyReminder.mutate({ enabled, hour: DAILY_REMINDER_HOUR })}
          />
        </Box>
      </Box>
    </Box>
  );
}
