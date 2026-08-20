import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { isBiometricAvailable } from '@/features/security/biometrics';
import { PIN_LENGTH, PinPad } from '@/features/security/components/PinPad';
import { clearPin, hasPinSet, setPin as savePin } from '@/features/security/pin';
import { useSettingsStore } from '@/state/useSettingsStore';
import { useAppTheme } from '@/theme/ThemeProvider';

type SetupStep = 'closed' | 'enter' | 'confirm';

export default function AppLockSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const appLockEnabled = useSettingsStore((s) => s.appLockEnabled);
  const biometricEnabled = useSettingsStore((s) => s.biometricEnabled);
  const setAppLockEnabled = useSettingsStore((s) => s.setAppLockEnabled);
  const setBiometricEnabled = useSettingsStore((s) => s.setBiometricEnabled);

  const [biometricHardwareAvailable, setBiometricHardwareAvailable] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>('closed');
  const [firstPin, setFirstPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [mismatch, setMismatch] = useState(false);

  useEffect(() => {
    void isBiometricAvailable().then(setBiometricHardwareAvailable);
  }, []);

  async function handleToggleAppLock(value: boolean) {
    if (value) {
      const alreadySet = await hasPinSet();
      if (!alreadySet) {
        setSetupStep('enter');
        return;
      }
      setAppLockEnabled(true);
    } else {
      setAppLockEnabled(false);
      setBiometricEnabled(false);
      await clearPin();
    }
  }

  useEffect(() => {
    if (setupStep === 'enter' && pinInput.length === PIN_LENGTH) {
      setFirstPin(pinInput);
      setPinInput('');
      setSetupStep('confirm');
    } else if (setupStep === 'confirm' && pinInput.length === PIN_LENGTH) {
      if (pinInput === firstPin) {
        void savePin(pinInput).then(() => {
          setAppLockEnabled(true);
          setSetupStep('closed');
          setPinInput('');
          setFirstPin('');
        });
      } else {
        setMismatch(true);
        setPinInput('');
        setSetupStep('enter');
      }
    }
  }, [pinInput, setupStep, firstPin, setAppLockEnabled]);

  if (setupStep !== 'closed') {
    return (
      <Box flex={1} backgroundColor="mainBackground" alignItems="center" justifyContent="center" padding="l">
        <Text variant="title" marginBottom="l">
          {setupStep === 'enter' ? t('security.setupPin') : t('security.confirmPin')}
        </Text>
        {mismatch ? (
          <Text variant="caption" color="danger" marginBottom="m">
            {t('security.pinMismatch')}
          </Text>
        ) : null}
        <PinPad value={pinInput} onChange={setPinInput} />
        <Pressable onPress={() => setSetupStep('closed')} style={{ marginTop: 24 }}>
          <Text variant="body" color="textSecondary">
            {t('common.cancel')}
          </Text>
        </Pressable>
      </Box>
    );
  }

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <Box padding="l" flexDirection="row" alignItems="center">
        <Pressable onPress={() => router.back()} style={{ marginEnd: 12 }}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <Text variant="title">{t('settings.appLock')}</Text>
      </Box>

      <Box paddingHorizontal="l">
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
          <Text variant="body">{t('security.enableAppLock')}</Text>
          <Switch value={appLockEnabled} onValueChange={handleToggleAppLock} />
        </Box>

        {appLockEnabled && biometricHardwareAvailable ? (
          <Box flexDirection="row" alignItems="center" justifyContent="space-between" backgroundColor="surfaceAlt" borderRadius="m" padding="m">
            <Text variant="body">{t('security.enableBiometrics')}</Text>
            <Switch value={biometricEnabled} onValueChange={setBiometricEnabled} />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
