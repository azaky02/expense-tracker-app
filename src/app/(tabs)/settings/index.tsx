import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useSettingsStore } from '@/state/useSettingsStore';
import { useAppTheme } from '@/theme/ThemeProvider';

function SettingsRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Box
        flexDirection="row"
        alignItems="center"
        backgroundColor="surfaceAlt"
        borderRadius="m"
        padding="m"
        marginBottom="s"
        style={{ opacity: onPress ? 1 : 0.5 }}
      >
        <Ionicons name={icon} size={20} color={theme.colors.textPrimary} style={{ marginEnd: 12 }} />
        <Text variant="body" flex={1}>
          {label}
        </Text>
        {onPress ? <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} /> : null}
      </Box>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const userName = useSettingsStore((s) => s.userName);
  const setUserName = useSettingsStore((s) => s.setUserName);

  return (
    <Box flex={1} backgroundColor="mainBackground" padding="l" style={{ paddingTop: insets.top + 16 }}>
      <Text variant="header" marginBottom="l">
        {t('nav.settings')}
      </Text>

      <Text variant="caption" marginBottom="xs">
        {t('settings.yourName')}
      </Text>
      <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l">
        <TextInput
          defaultValue={userName}
          onChangeText={setUserName}
          placeholder={t('settings.yourNamePlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          style={{ color: theme.colors.textPrimary }}
        />
      </Box>

      <SettingsRow icon="search" label={t('search.title')} onPress={() => router.push('/search')} />
      <SettingsRow icon="hand-left" label={t('custody.title')} onPress={() => router.push('/custody')} />
      <SettingsRow icon="repeat" label={t('recurring.title')} onPress={() => router.push('/recurring')} />
      <SettingsRow icon="receipt" label={t('bills.title')} onPress={() => router.push('/bills')} />
      <SettingsRow icon="flag" label={t('goals.title')} onPress={() => router.push('/goals')} />
      <SettingsRow icon="trending-up" label={t('forecast.title')} onPress={() => router.push('/forecast')} />
      <SettingsRow icon="pricetags" label={t('categories.manage')} onPress={() => router.push('/settings/categories')} />
      <SettingsRow icon="language" label={t('settings.language')} onPress={() => router.push('/settings/language')} />
      <SettingsRow icon="cash" label={t('settings.currencyAndCountry')} onPress={() => router.push('/settings/currency')} />
      <SettingsRow icon="business" label={t('settings.banks')} onPress={() => router.push('/settings/banks')} />
      <SettingsRow icon="calendar" label={t('settings.calendar')} onPress={() => router.push('/settings/calendar')} />
      <SettingsRow icon="notifications" label={t('settings.notifications')} onPress={() => router.push('/settings/notifications')} />
      <SettingsRow icon="lock-closed" label={t('settings.appLock')} onPress={() => router.push('/settings/appLock')} />
      <SettingsRow icon="cloud-upload" label={t('settings.backup')} onPress={() => router.push('/settings/backup')} />
    </Box>
  );
}
