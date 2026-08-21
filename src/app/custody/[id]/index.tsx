import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Text } from '@/components/Text';
import {
  useCustodyRecord,
  useCustodySettlements,
  useDeleteCustodyRecord,
  useSettleCustody,
  useUpdateCustodyRecord,
} from '@/features/custody/hooks';
import { formatAmount } from '@/lib/currency';
import { todayIso } from '@/lib/dates';
import { useAppTheme } from '@/theme/ThemeProvider';

export default function CustodyDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: record } = useCustodyRecord(id);
  const { data: settlements } = useCustodySettlements(id);
  const settleCustody = useSettleCustody();
  const updateCustody = useUpdateCustodyRecord();
  const deleteCustody = useDeleteCustodyRecord();
  const [amount, setAmount] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editReason, setEditReason] = useState('');

  if (!record) {
    return <Box flex={1} backgroundColor="mainBackground" />;
  }

  const isUntouched = record.status === 'Open' && record.remainingAmount === record.originalAmount;

  async function handleSettle() {
    const value = Number(amount);
    if (!value || value <= 0 || !record) return;
    await settleCustody.mutateAsync({ id: record.id, amount: value, date: todayIso() });
    setAmount('');
  }

  function startEdit() {
    setEditAmount(String(record!.originalAmount));
    setEditReason(record!.reason ?? '');
    setIsEditing(true);
  }

  async function handleSaveEdit() {
    const value = Number(editAmount);
    if (!value || value <= 0) return;
    await updateCustody.mutateAsync({ id: record!.id, originalAmount: value, reason: editReason });
    setIsEditing(false);
  }

  function handleDelete() {
    Alert.alert(t('common.delete'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const result = await deleteCustody.mutateAsync(record!.id);
          if (result.deleted) router.back();
        },
      },
    ]);
  }

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <FlatList
        data={settlements ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Box flexDirection="row" justifyContent="space-between" backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
            <Text variant="caption">{item.date}</Text>
            <Text variant="subtitle">{formatAmount(item.amount)}</Text>
          </Box>
        )}
        ListHeaderComponent={
          <Box marginBottom="l">
            <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="l">
              <Text variant="header">{record.personName}</Text>
              {isUntouched ? (
                <Pressable onPress={isEditing ? handleSaveEdit : startEdit}>
                  <Text variant="body" color="accent">
                    {isEditing ? t('common.save') : t('common.edit')}
                  </Text>
                </Pressable>
              ) : null}
            </Box>

            <Box backgroundColor="surface" borderRadius="l" padding="l" marginBottom="l" style={{ gap: 8 }}>
              {isEditing ? (
                <>
                  <Text variant="caption">{t('custody.originalAmount')}</Text>
                  <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m">
                    <TextInput keyboardType="decimal-pad" value={editAmount} onChangeText={setEditAmount} style={{ color: theme.colors.textPrimary }} />
                  </Box>
                  <Text variant="caption">{t('custody.reason')}</Text>
                  <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m">
                    <TextInput value={editReason} onChangeText={setEditReason} style={{ color: theme.colors.textPrimary }} />
                  </Box>
                </>
              ) : (
                <>
                  <Box flexDirection="row" justifyContent="space-between">
                    <Text variant="caption">{t('custody.originalAmount')}</Text>
                    <Text variant="body">{formatAmount(record.originalAmount)}</Text>
                  </Box>
                  <Box flexDirection="row" justifyContent="space-between">
                    <Text variant="caption">{t('custody.remainingAmount')}</Text>
                    <Text variant="subtitle">{formatAmount(record.remainingAmount)}</Text>
                  </Box>
                  <Box flexDirection="row" justifyContent="space-between">
                    <Text variant="caption">{t('common.status')}</Text>
                    <Text variant="body">{t(`custody.status.${record.status}`)}</Text>
                  </Box>
                </>
              )}
            </Box>

            {record.status !== 'Closed' ? (
              <Box marginBottom="l">
                <Text variant="caption" marginBottom="xs">
                  {t('custody.recordReturn')}
                </Text>
                <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
                  <TextInput
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    style={{ color: theme.colors.textPrimary }}
                  />
                </Box>
                <PrimaryButton label={t('custody.recordReturn')} onPress={handleSettle} loading={settleCustody.isPending} />
              </Box>
            ) : null}

            {isUntouched ? (
              <Pressable onPress={handleDelete} style={{ marginBottom: 16 }}>
                <Box backgroundColor="dangerSurface" borderRadius="m" padding="m" alignItems="center">
                  <Text variant="subtitle" color="danger">
                    {t('common.delete')}
                  </Text>
                </Box>
              </Pressable>
            ) : null}

            <Text variant="subtitle" marginBottom="m">
              {t('custody.settlementHistory')}
            </Text>
          </Box>
        }
      />
    </Box>
  );
}
