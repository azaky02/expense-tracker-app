import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useDeactivateRecurringRule, useRecurringRules } from '@/features/recurring/hooks';
import type { RecurringRuleRecord } from '@/features/recurring/types';
import { formatAmount } from '@/lib/currency';
import { useAppTheme } from '@/theme/ThemeProvider';

function RecurringRow({ item, onOpen, onDelete }: { item: RecurringRuleRecord; onOpen: () => void; onDelete: () => void }) {
  const { t } = useTranslation();
  const isExpense = item.type === 'Expense';
  return (
    <Pressable onPress={onOpen}>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
        <Box flex={1}>
          <Text variant="subtitle">{item.name}</Text>
          <Text variant="caption">
            {t(`recurring.frequencies.${item.frequency}`)} · {t('recurring.nextOn', { date: item.nextOccurrence })}
          </Text>
        </Box>
        <Text variant={isExpense ? 'amountNegative' : 'amountPositive'} style={{ marginEnd: 12 }}>
          {isExpense ? '-' : '+'}
          {formatAmount(item.amount)}
        </Text>
        <Pressable onPress={onDelete}>
          <Ionicons name="pause-circle-outline" size={18} />
        </Pressable>
      </Box>
    </Pressable>
  );
}

export default function RecurringListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { data: rules } = useRecurringRules();
  const deactivate = useDeactivateRecurringRule();

  function handleDelete(id: string) {
    Alert.alert(t('recurring.stop'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('recurring.stop'), style: 'destructive', onPress: () => deactivate.mutate(id) },
    ]);
  }

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <FlatList
        data={rules ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <RecurringRow item={item} onOpen={() => router.push(`/recurring/${item.id}/edit`)} onDelete={() => handleDelete(item.id)} />
        )}
        ListHeaderComponent={
          <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="l">
            <Text variant="header">{t('recurring.title')}</Text>
            <Pressable onPress={() => router.push('/recurring/add')}>
              <Ionicons name="add-circle" size={28} color={theme.colors.accent} />
            </Pressable>
          </Box>
        }
      />
    </Box>
  );
}
