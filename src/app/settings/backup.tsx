import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Text } from '@/components/Text';
import { exportBackup, importBackup } from '@/features/backup/api';
import { reconcileAllCardNotifications } from '@/lib/notifications/scheduler';
import { useAppTheme } from '@/theme/ThemeProvider';

export default function BackupSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [isBusy, setIsBusy] = useState(false);

  async function handleExport() {
    setIsBusy(true);
    try {
      const uri = await exportBackup();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/json' });
      }
    } finally {
      setIsBusy(false);
    }
  }

  function handleImport() {
    Alert.alert(t('backup.importWarningTitle'), t('backup.importWarningBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('backup.import'),
        style: 'destructive',
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
          if (result.canceled || !result.assets[0]) return;
          setIsBusy(true);
          try {
            await importBackup(result.assets[0].uri);
            await queryClient.invalidateQueries();
            await reconcileAllCardNotifications();
            Alert.alert(t('backup.importSuccess'));
          } finally {
            setIsBusy(false);
          }
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
        <Text variant="title">{t('settings.backup')}</Text>
      </Box>

      <Box paddingHorizontal="l" style={{ gap: 12 }}>
        <Text variant="caption" marginBottom="s">
          {t('backup.description')}
        </Text>
        <PrimaryButton label={t('backup.export')} onPress={handleExport} loading={isBusy} />
        <PrimaryButton label={t('backup.import')} onPress={handleImport} loading={isBusy} />
      </Box>
    </Box>
  );
}
