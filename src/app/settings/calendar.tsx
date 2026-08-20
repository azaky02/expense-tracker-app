import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useSettingsStore, type CalendarSystem } from '@/state/useSettingsStore';
import { useAppTheme } from '@/theme/ThemeProvider';

const OPTIONS: { value: CalendarSystem; labelKey: 'dates.gregorian' | 'dates.hijri' }[] = [
  { value: 'gregorian', labelKey: 'dates.gregorian' },
  { value: 'hijri', labelKey: 'dates.hijri' },
];

export default function CalendarSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const calendar = useSettingsStore((s) => s.calendar);
  const setCalendar = useSettingsStore((s) => s.setCalendar);

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <Box padding="l" flexDirection="row" alignItems="center">
        <Pressable onPress={() => router.back()} style={{ marginEnd: 12 }}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <Text variant="title">{t('settings.calendar')}</Text>
      </Box>

      <Box paddingHorizontal="l">
        {OPTIONS.map((option) => (
          <Pressable key={option.value} onPress={() => setCalendar(option.value)}>
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              backgroundColor="surfaceAlt"
              borderRadius="m"
              padding="m"
              marginBottom="s"
            >
              <Text variant="body">{t(option.labelKey)}</Text>
              {calendar === option.value ? <Ionicons name="checkmark" size={20} color={theme.colors.accent} /> : null}
            </Box>
          </Pressable>
        ))}
      </Box>
    </Box>
  );
}
