import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useSettingsStore } from '@/state/useSettingsStore';
import { useLockStore } from '@/state/useLockStore';
import { useAppTheme } from '@/theme/ThemeProvider';

import { authenticateWithBiometrics } from '../biometrics';
import { verifyPin } from '../pin';
import { PIN_LENGTH, PinPad } from './PinPad';

export function UnlockScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const unlock = useLockStore((s) => s.unlock);
  const biometricEnabled = useSettingsStore((s) => s.biometricEnabled);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (biometricEnabled) {
      void tryBiometric();
    }
    // Only attempt automatically once, when the unlock screen first mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function tryBiometric() {
    const success = await authenticateWithBiometrics(t('security.unlockPrompt'));
    if (success) unlock();
  }

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    void (async () => {
      const isValid = await verifyPin(pin);
      if (isValid) {
        unlock();
      } else {
        setError(true);
        setPin('');
      }
    })();
  }, [pin, unlock]);

  return (
    <Box flex={1} backgroundColor="mainBackground" alignItems="center" justifyContent="center" padding="l">
      <Ionicons name="lock-closed" size={40} color={theme.colors.accent} style={{ marginBottom: 24 }} />
      <Text variant="title" marginBottom="l">
        {t('security.enterPin')}
      </Text>
      {error ? (
        <Text variant="caption" color="danger" marginBottom="m">
          {t('security.wrongPin')}
        </Text>
      ) : null}
      <PinPad value={pin} onChange={setPin} />
      {biometricEnabled ? (
        <Pressable onPress={tryBiometric} style={{ marginTop: 24 }}>
          <Text variant="body" color="accent">
            {t('security.useBiometrics')}
          </Text>
        </Pressable>
      ) : null}
    </Box>
  );
}
