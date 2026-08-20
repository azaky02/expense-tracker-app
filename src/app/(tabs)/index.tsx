import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useCards } from '@/features/cards/hooks';
import { useExpenseCategoryBreakdown, useMonthSummary, useRecentTransactions } from '@/features/transactions/hooks';
import type { TransactionListItem } from '@/features/transactions/types';
import { formatAmount } from '@/lib/currency';
import { daysUntilNextDueDate, getMonthRange } from '@/lib/dates';
import { useSettingsStore } from '@/state/useSettingsStore';
import { useChartPalette } from '@/theme/ThemeProvider';

function useUpcomingDueCard() {
  const { data: cards } = useCards();
  return useMemo(() => {
    const creditCards = (cards ?? []).filter((c) => c.cardCategory === 'Credit' && c.dueDateDay != null);
    const withDays = creditCards.map((c) => ({ card: c, days: daysUntilNextDueDate(c.dueDateDay!) }));
    const upcoming = withDays.filter((c) => c.days <= 7).sort((a, b) => a.days - b.days);
    return upcoming[0];
  }, [cards]);
}

function TransactionRow({ item }: { item: TransactionListItem }) {
  const { t } = useTranslation();
  const isExpense = item.type === 'Expense';
  return (
    <Box flexDirection="row" alignItems="center" backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
      <Box
        width={40}
        height={40}
        borderRadius="round"
        backgroundColor="chip"
        alignItems="center"
        justifyContent="center"
        marginEnd="m"
      >
        <Text style={{ fontSize: 18 }}>{item.categoryIcon || '📌'}</Text>
      </Box>
      <Box flex={1}>
        <Text variant="subtitle">{item.beneficiaryName || item.categoryName}</Text>
        <Text variant="caption">{item.paymentMethodType === 'Cash' ? t('common.cash') : item.cardNickname}</Text>
      </Box>
      <Text variant={isExpense ? 'amountNegative' : 'amountPositive'}>
        {isExpense ? '-' : '+'}
        {formatAmount(item.amount)}
      </Text>
    </Box>
  );
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userName = useSettingsStore((s) => s.userName);
  const chartPalette = useChartPalette();

  const { start, end } = useMemo(() => getMonthRange(), []);
  const { data: summary } = useMonthSummary(start, end);
  const { data: breakdown } = useExpenseCategoryBreakdown(start, end);
  const { data: recent } = useRecentTransactions(5);
  const upcomingDue = useUpcomingDueCard();

  const income = summary?.income ?? 0;
  const expense = summary?.expense ?? 0;
  const remaining = income - expense;

  const chartData = (breakdown ?? []).map((item, i) => ({
    value: item.total,
    color: item.categoryColor || chartPalette[i % chartPalette.length],
  }));

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <FlatList
        data={recent ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionRow item={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <Box marginBottom="l">
            <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="l">
              <Text variant="header">{userName ? t('dashboard.greeting', { name: userName }) : t('dashboard.greetingGeneric')}</Text>
              <Pressable onPress={() => router.push('/reports')}>
                <Ionicons name="bar-chart" size={24} />
              </Pressable>
            </Box>

            <Box backgroundColor="primary" borderRadius="l" padding="l" marginBottom="l">
              <Text variant="caption" color="textOnDarkSecondary">
                {t('dashboard.totalSpentThisMonth')}
              </Text>
              <Text variant="amountLarge">{formatAmount(expense)}</Text>
              <Text variant="caption" color="income" style={{ marginTop: 4 }}>
                {t('dashboard.income')}: {formatAmount(income)} | {t('dashboard.remaining')}: {formatAmount(remaining)}
              </Text>
            </Box>

            {chartData.length > 0 ? (
              <Box marginBottom="l">
                <Text variant="subtitle" marginBottom="m">
                  {t('dashboard.expenseByCategory')}
                </Text>
                <Box flexDirection="row" alignItems="center">
                  <PieChart data={chartData} donut radius={70} innerRadius={45} />
                  <Box marginStart="l" style={{ gap: 8 }}>
                    {(breakdown ?? []).slice(0, 5).map((item) => (
                      <Box key={item.categoryId} flexDirection="row" alignItems="center">
                        <Box width={10} height={10} borderRadius="s" marginEnd="s" style={{ backgroundColor: item.categoryColor }} />
                        <Text variant="caption">{item.categoryName}</Text>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            ) : null}

            {upcomingDue ? (
              <Box backgroundColor="warningSurface" borderRadius="m" padding="m" marginBottom="l">
                <Text variant="body" color="warning">
                  {t('dashboard.dueSoonAlert', { days: upcomingDue.days, cardName: upcomingDue.card.nickname })}
                </Text>
              </Box>
            ) : null}

            <Text variant="subtitle" marginBottom="m">
              {t('dashboard.recentTransactions')}
            </Text>
          </Box>
        }
      />
    </Box>
  );
}
