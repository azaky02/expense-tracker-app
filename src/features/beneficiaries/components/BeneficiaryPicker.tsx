import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, TextInput } from 'react-native';

import { Box } from '@/components/Box';
import { Chip } from '@/components/Chip';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/ThemeProvider';

import { useBeneficiaries, useClearDefaultBeneficiary, useCreateBeneficiary, useSetDefaultBeneficiary } from '../hooks';

interface BeneficiaryPickerProps {
  value: string | null | undefined;
  onSelect: (name: string) => void;
}

export function BeneficiaryPicker({ value, onSelect }: BeneficiaryPickerProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { data: beneficiaries } = useBeneficiaries();
  const createBeneficiary = useCreateBeneficiary();
  const setDefault = useSetDefaultBeneficiary();
  const clearDefault = useClearDefaultBeneficiary();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  async function handleAdd() {
    if (!newName.trim()) return;
    await createBeneficiary.mutateAsync(newName);
    onSelect(newName.trim());
    setNewName('');
    setShowAdd(false);
  }

  return (
    <Box>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {(beneficiaries ?? []).map((b) => (
          <Box key={b.id} flexDirection="row" alignItems="center">
            <Chip label={b.name} selected={value === b.name} onPress={() => onSelect(b.name)} />
            <Pressable
              onPress={() => (b.isDefault ? clearDefault.mutate(b.id) : setDefault.mutate(b.id))}
              style={{ marginStart: -6, marginEnd: 6, padding: 4 }}
            >
              <Ionicons name={b.isDefault ? 'star' : 'star-outline'} size={14} color={theme.colors.accent} />
            </Pressable>
          </Box>
        ))}
        <Chip label={`+ ${t('common.add')}`} selected={showAdd} onPress={() => setShowAdd((v) => !v)} />
      </ScrollView>

      {showAdd ? (
        <Box flexDirection="row" alignItems="center" marginTop="s" style={{ gap: 8 }}>
          <Box flex={1} backgroundColor="surfaceAlt" borderRadius="m" padding="m">
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder={t('transactions.beneficiaryPlaceholder')}
              placeholderTextColor={theme.colors.textSecondary}
              style={{ color: theme.colors.textPrimary }}
            />
          </Box>
          <Pressable onPress={handleAdd}>
            <Text variant="body" color="accent">
              {t('common.add')}
            </Text>
          </Pressable>
        </Box>
      ) : null}
    </Box>
  );
}
