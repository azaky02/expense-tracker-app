import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useCard } from '@/features/cards/hooks';
import { useCardMonthSpend, useCardTransactions } from '@/features/transactions/hooks';
import type { TransactionListItem } from '@/features/transactions/types';
import { formatAmount } from '@/lib/currency';
import { getMonthRange } from '@/lib/dates';
import { formatDateForDisplay } from '@/lib/hijri';
import { useSettingsStore } from '@/state/useSettingsStore';

function TransactionRow({ item }: { item: TransactionListItem }) {
  const calendar = useSettingsStore((s) => s.calendar);
  const isExpense = item.type === 'Expense';
  return (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between" backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
      <Box>
        <Text variant="subtitle">{item.beneficiaryName || item.categoryName}</Text>
        <Text variant="caption">{formatDateForDisplay(item.date, calendar)}</Text>
      </Box>
      <Text variant={isExpense ? 'amountNegative' : 'amountPositive'}>
        {isExpense ? '-' : '+'}
        {formatAmount(item.amount)}
      </Text>
    </Box>
  );
}

export default function CardDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: card } = useCard(id);
  const { data: transactions } = useCardTransactions(id);
  const { start, end } = useMemo(() => getMonthRange(), []);
  const { data: monthSpend } = useCardMonthSpend(id, start, end);

  if (!card) {
    return <Box flex={1} backgroundColor="mainBackground" />;
  }

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <FlatList
        data={transactions ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => <TransactionRow item={item} />}
        ListHeaderComponent={
          <Box marginBottom="l">
            <Text variant="header" marginBottom="l">
              {t('cards.cardDetails')}
            </Text>
            <Box borderRadius="l" padding="l" marginBottom="m" style={{ backgroundColor: card.color }}>
              <Text variant="subtitle" color="textOnDark">
                {card.nickname}
              </Text>
              <Text variant="caption" color="textOnDarkSecondary">
                {card.bankName} • {card.cardType} {card.cardCategory}
              </Text>
              <Text variant="body" color="textOnDark" style={{ marginTop: 12 }}>
                •••• •••• •••• {card.last4Digits}
              </Text>
              {card.creditLimit ? (
                <Text variant="caption" color="textOnDarkSecondary" style={{ marginTop: 8 }}>
                  {t('cards.creditLimit')}: {formatAmount(card.creditLimit)}
                </Text>
              ) : null}
            </Box>

            <Box flexDirection="row" style={{ gap: 12 }} marginBottom="l">
              {card.dueDateDay ? (
                <Box flex={1} backgroundColor="warningSurface" borderRadius="m" padding="m">
                  <Text variant="caption" color="warning">
                    {t('cards.dueDate')}
                  </Text>
                  <Text variant="subtitle" color="warning">
                    {card.dueDateDay}
                  </Text>
                </Box>
              ) : null}
              <Box flex={1} backgroundColor="surfaceAlt" borderRadius="m" padding="m">
                <Text variant="caption">{t('cards.spendThisMonth')}</Text>
                <Text variant="subtitle">{formatAmount(monthSpend ?? 0)}</Text>
              </Box>
            </Box>

            <Text variant="subtitle" marginBottom="m">
              {t('cards.cardTransactions')}
            </Text>
          </Box>
        }
        ListFooterComponent={
          <Pressable onPress={() => router.push(`/cards/${id}/edit`)}>
            <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" alignItems="center" marginTop="m">
              <Text variant="subtitle">⚙ {t('cards.editCard')}</Text>
            </Box>
          </Pressable>
        }
      />
    </Box>
  );
}
