import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useSettingsStore } from '@/state/useSettingsStore';
import { useLockStore } from '@/state/useLockStore';

import { authenticateWithBiometrics } from '../biometrics';
import { verifyPin } from '../pin';
import { PIN_LENGTH, PinPad } from './PinPad';

const gold = '#D9B65C';

const TRUST_BADGES: { icon: keyof typeof Ionicons.glyphMap; labelKey: string }[] = [
  { icon: 'shield-checkmark', labelKey: 'security.trustAbsoluteSecurity' },
  { icon: 'lock-closed', labelKey: 'security.trustPrivacyFirst' },
  { icon: 'cloud-offline', labelKey: 'security.trustOffline' },
  { icon: 'cloud-upload', labelKey: 'security.trustBackup' },
];

export function UnlockScreen() {
  const { t } = useTranslation();
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
    <View style={{ flex: 1, backgroundColor: '#0B0B0D' }}>
      <Box flex={1} alignItems="center" justifyContent="center" padding="l">
        <AppLogo size={100} />

        <Text style={{ color: gold, fontWeight: '700', fontSize: 20, marginTop: 28, marginBottom: 20 }}>
          {t('security.signIn')}
        </Text>

        {error ? (
          <Text variant="caption" color="danger" marginBottom="m">
            {t('security.wrongPin')}
          </Text>
        ) : (
          <Text style={{ color: '#9C9689', fontSize: 12, marginBottom: 16 }}>{t('security.enterPin')}</Text>
        )}

        <PinPad value={pin} onChange={setPin} />

        {biometricEnabled ? (
          <>
            <Box flexDirection="row" alignItems="center" style={{ gap: 10, width: 220 }} marginTop="l" marginBottom="l">
              <Box flex={1} height={1} style={{ backgroundColor: '#232323' }} />
              <Text style={{ color: '#9C9689', fontSize: 12 }}>{t('common.or')}</Text>
              <Box flex={1} height={1} style={{ backgroundColor: '#232323' }} />
            </Box>
            <Pressable onPress={tryBiometric}>
              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
                borderRadius="m"
                paddingVertical="m"
                paddingHorizontal="xl"
                style={{ borderWidth: 1.5, borderColor: gold, gap: 10 }}
              >
                <Ionicons name="finger-print" size={20} color={gold} />
                <Text style={{ color: gold, fontWeight: '700', fontSize: 14 }}>{t('security.useBiometrics')}</Text>
              </Box>
            </Pressable>
          </>
        ) : null}

        <Pressable
          onPress={() => Alert.alert(t('security.forgotPin'), t('security.forgotPinHelp'))}
          style={{ marginTop: 20 }}
        >
          <Text style={{ color: gold, fontSize: 13 }}>{t('security.forgotPin')}</Text>
        </Pressable>
      </Box>

      <Box flexDirection="row" justifyContent="space-around" paddingHorizontal="l" paddingBottom="xl" paddingTop="m" style={{ borderTopWidth: 1, borderTopColor: '#1B1B1B' }}>
        {TRUST_BADGES.map((badge) => (
          <Box key={badge.labelKey} alignItems="center" style={{ gap: 4, maxWidth: 76 }}>
            <Ionicons name={badge.icon} size={18} color={gold} />
            <Text style={{ color: '#9C9689', fontSize: 10, textAlign: 'center' }}>{t(badge.labelKey)}</Text>
          </Box>
        ))}
      </Box>
    </View>
  );
}
