import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Text } from '@/components/Text';
import { useBanks, useCreateCustomBank, useDeleteBank, useRenameBank } from '@/features/banks/hooks';
import type { BankRecord } from '@/features/banks/api';
import { useAppTheme } from '@/theme/ThemeProvider';

function BankRow({ bank, onRename, onDelete }: { bank: BankRecord; onRename: (name: string) => void; onDelete: () => void }) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(bank.name);

  if (editing) {
    return (
      <Box flexDirection="row" alignItems="center" backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s" style={{ gap: 8 }}>
        <Box flex={1}>
          <TextInput value={name} onChangeText={setName} style={{ color: theme.colors.textPrimary }} />
        </Box>
        <Pressable
          onPress={() => {
            onRename(name);
            setEditing(false);
          }}
        >
          <Ionicons name="checkmark" size={20} color={theme.colors.accent} />
        </Pressable>
      </Box>
    );
  }

  return (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between" backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
      <Text variant="body">{bank.name}</Text>
      {bank.isCustom ? (
        <Box flexDirection="row" style={{ gap: 14 }}>
          <Pressable onPress={() => setEditing(true)}>
            <Ionicons name="pencil" size={18} color={theme.colors.textSecondary} />
          </Pressable>
          <Pressable onPress={onDelete}>
            <Ionicons name="trash" size={18} color={theme.colors.danger} />
          </Pressable>
        </Box>
      ) : (
        <Text variant="caption">{t('common.default')}</Text>
      )}
    </Box>
  );
}

export default function BanksSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { data: banks } = useBanks();
  const createBank = useCreateCustomBank();
  const renameBank = useRenameBank();
  const deleteBank = useDeleteBank();
  const [newName, setNewName] = useState('');

  async function handleDelete(bank: BankRecord) {
    const result = await deleteBank.mutateAsync(bank.id);
    if (!result.deleted) {
      Alert.alert(result.reason === 'inUse' ? t('banks.inUseError') : t('banks.defaultError'));
    }
  }

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <Box padding="l" flexDirection="row" alignItems="center">
        <Pressable onPress={() => router.back()} style={{ marginEnd: 12 }}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <Text variant="title">{t('settings.banks')}</Text>
      </Box>

      <FlatList
        data={banks ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <BankRow bank={item} onRename={(name) => renameBank.mutate({ id: item.id, name })} onDelete={() => handleDelete(item)} />
        )}
        ListFooterComponent={
          <Box flexDirection="row" alignItems="center" marginTop="s" style={{ gap: 8 }}>
            <Box flex={1} backgroundColor="surfaceAlt" borderRadius="m" padding="m">
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder={t('banks.newBankPlaceholder')}
                placeholderTextColor={theme.colors.textSecondary}
                style={{ color: theme.colors.textPrimary }}
              />
            </Box>
            <PrimaryButton
              label={t('common.add')}
              onPress={async () => {
                if (!newName.trim()) return;
                await createBank.mutateAsync(newName);
                setNewName('');
              }}
            />
          </Box>
        }
      />
    </Box>
  );
}
