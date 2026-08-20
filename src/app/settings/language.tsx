import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { applyLanguageAndRestart } from '@/lib/locale';
import { useSettingsStore, type Language } from '@/state/useSettingsStore';
import { useAppTheme } from '@/theme/ThemeProvider';

const OPTIONS: { value: Language; label: string }[] = [
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
];

export default function LanguageSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  function handleSelect(value: Language) {
    if (value === language) return;
    Alert.alert(t('settings.language'), t('settings.restartToApply'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.save'),
        onPress: () => {
          setLanguage(value);
          applyLanguageAndRestart(value);
        },
      },
    ]);
  }

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <Box padding="l" flexDirection="row" alignItems="center">
        <Pressable onPress={() => router.back()} style={{ marginEnd: 12 }}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <Text variant="title">{t('settings.language')}</Text>
      </Box>

      <Box paddingHorizontal="l">
        {OPTIONS.map((option) => (
          <Pressable key={option.value} onPress={() => handleSelect(option.value)}>
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              backgroundColor="surfaceAlt"
              borderRadius="m"
              padding="m"
              marginBottom="s"
            >
              <Text variant="body">{option.label}</Text>
              {language === option.value ? <Ionicons name="checkmark" size={20} color={theme.colors.accent} /> : null}
            </Box>
          </Pressable>
        ))}
      </Box>
    </Box>
  );
}
