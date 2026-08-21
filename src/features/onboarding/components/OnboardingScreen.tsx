import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput } from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { Box } from '@/components/Box';
import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Text } from '@/components/Text';
import { applyLanguageAndRestart } from '@/lib/locale';
import { useSettingsStore, type CalendarSystem, type Language } from '@/state/useSettingsStore';
import { useAppTheme } from '@/theme/ThemeProvider';

export function OnboardingScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const language = useSettingsStore((s) => s.language);
  const setUserName = useSettingsStore((s) => s.setUserName);
  const setCalendar = useSettingsStore((s) => s.setCalendar);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  const [name, setName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [selectedCalendar, setSelectedCalendar] = useState<CalendarSystem>('gregorian');

  function handleFinish() {
    setUserName(name.trim());
    setCalendar(selectedCalendar);
    completeOnboarding();
    // Restarts the app only if the picked language actually requires an RTL flip.
    applyLanguageAndRestart(selectedLanguage);
  }

  return (
    <Box flex={1} backgroundColor="mainBackground" padding="l" justifyContent="center">
      <Box alignItems="center" marginBottom="l">
        <AppLogo size={84} />
      </Box>
      <Text variant="header" marginBottom="xs" textAlign="center">
        {t('onboarding.welcome')}
      </Text>
      <Text variant="caption" textAlign="center" marginBottom="l">
        {t('onboarding.tagline')}
      </Text>

      <Text variant="caption" marginBottom="xs">
        {t('settings.yourName')}
      </Text>
      <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('settings.yourNamePlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          style={{ color: theme.colors.textPrimary }}
        />
      </Box>

      <Text variant="caption" marginBottom="xs">
        {t('settings.language')}
      </Text>
      <Box flexDirection="row" style={{ gap: 8 }} marginBottom="l">
        <Chip label="العربية" selected={selectedLanguage === 'ar'} onPress={() => setSelectedLanguage('ar')} />
        <Chip label="English" selected={selectedLanguage === 'en'} onPress={() => setSelectedLanguage('en')} />
      </Box>

      <Text variant="caption" marginBottom="xs">
        {t('settings.calendar')}
      </Text>
      <Box flexDirection="row" style={{ gap: 8 }} marginBottom="xl">
        <Chip label={t('dates.gregorian')} selected={selectedCalendar === 'gregorian'} onPress={() => setSelectedCalendar('gregorian')} />
        <Chip label={t('dates.hijri')} selected={selectedCalendar === 'hijri'} onPress={() => setSelectedCalendar('hijri')} />
      </Box>

      <PrimaryButton label={t('onboarding.getStarted')} onPress={handleFinish} />
    </Box>
  );
}
