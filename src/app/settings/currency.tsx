import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { COUNTRIES } from '@/lib/countries';
import { CURRENCY_OPTIONS, CURRENCY_SYMBOLS } from '@/lib/currency';
import { useSettingsStore } from '@/state/useSettingsStore';
import { useAppTheme } from '@/theme/ThemeProvider';

export default function CurrencySettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const country = useSettingsStore((s) => s.country);
  const setCountry = useSettingsStore((s) => s.setCountry);
  const currency = useSettingsStore((s) => s.currency);
  const setCurrency = useSettingsStore((s) => s.setCurrency);
  const isArabic = i18n.language === 'ar';

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <Box padding="l" flexDirection="row" alignItems="center">
        <Pressable onPress={() => router.back()} style={{ marginEnd: 12 }}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <Text variant="title">{t('settings.currencyAndCountry')}</Text>
      </Box>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text variant="caption" marginBottom="s">
          {t('settings.country')}
        </Text>
        {COUNTRIES.map((option) => (
          <Pressable
            key={option.code}
            onPress={() => {
              setCountry(option.code);
              setCurrency(option.defaultCurrency);
            }}
          >
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              backgroundColor="surfaceAlt"
              borderRadius="m"
              padding="m"
              marginBottom="s"
            >
              <Text variant="body">{isArabic ? option.nameAr : option.nameEn}</Text>
              {country === option.code ? <Ionicons name="checkmark" size={20} color={theme.colors.accent} /> : null}
            </Box>
          </Pressable>
        ))}

        <Text variant="caption" marginTop="l" marginBottom="s">
          {t('settings.currency')}
        </Text>
        {CURRENCY_OPTIONS.map((code) => (
          <Pressable key={code} onPress={() => setCurrency(code)}>
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              backgroundColor="surfaceAlt"
              borderRadius="m"
              padding="m"
              marginBottom="s"
            >
              <Text variant="body">
                {code} ({CURRENCY_SYMBOLS[code]})
              </Text>
              {currency === code ? <Ionicons name="checkmark" size={20} color={theme.colors.accent} /> : null}
            </Box>
          </Pressable>
        ))}
      </ScrollView>
    </Box>
  );
}
