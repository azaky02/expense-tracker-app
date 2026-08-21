import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useAccounts, useAccountsWithBalances } from '@/features/accounts/hooks';
import { useTotalCustodyBalance } from '@/features/custody/hooks';
import { useGoals } from '@/features/goals/hooks';
import {
  useExpenseCategoryBreakdown,
  useMonthComparison,
  useRecentTransactions,
  useWeeklyTotals,
} from '@/features/transactions/hooks';
import type { TransactionListItem } from '@/features/transactions/types';
import { formatAmount } from '@/lib/currency';
import { daysUntilNextDueDate, getMonthRange } from '@/lib/dates';
import { useSettingsStore } from '@/state/useSettingsStore';
import { useChartPalette } from '@/theme/ThemeProvider';

/** A deliberately dark/gold "premium" look for the dashboard only — not the app-wide theme. */
const gold = {
  bg: '#0B0B0D',
  card: '#141414',
  cardBorder: '#3A2E12',
  gold: '#D9B65C',
  goldSoft: 'rgba(217,182,92,0.15)',
  textPrimary: '#F5F1E6',
  textSecondary: '#9C9689',
  green: '#3FC97B',
  red: '#E4574C',
  divider: '#232323',
};

function useUpcomingDueCard() {
  const { data: accounts } = useAccounts();
  return useMemo(() => {
    const creditAccounts = (accounts ?? []).filter((a) => a.type === 'CreditCard' && a.dueDateDay != null);
    const withDays = creditAccounts.map((a) => ({ account: a, days: daysUntilNextDueDate(a.dueDateDay!) }));
    const upcoming = withDays.filter((a) => a.days <= 7).sort((a, b) => a.days - b.days);
    return upcoming[0];
  }, [accounts]);
}

function ChangeChip({ pct }: { pct: number | null }) {
  if (pct == null) return null;
  const up = pct >= 0;
  return (
    <Box flexDirection="row" alignItems="center">
      <Ionicons name={up ? 'arrow-up' : 'arrow-down'} size={11} color={up ? gold.green : gold.red} />
      <Text style={{ fontSize: 11, color: up ? gold.green : gold.red, marginStart: 2 }}>{Math.abs(Math.round(pct))}%</Text>
    </Box>
  );
}

function TransactionRow({ item }: { item: TransactionListItem }) {
  const isExpense = item.type === 'Expense';
  return (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between" padding="m" marginBottom="s" borderRadius="m" style={{ backgroundColor: gold.card }}>
      <Box flexDirection="row" alignItems="center" flex={1}>
        <Box width={38} height={38} borderRadius="round" alignItems="center" justifyContent="center" marginEnd="m" style={{ backgroundColor: gold.goldSoft }}>
          <Text style={{ fontSize: 16 }}>{item.categoryIcon || '📌'}</Text>
        </Box>
        <Box flex={1}>
          <Text style={{ color: gold.textPrimary, fontWeight: '700', fontSize: 14 }}>{item.beneficiaryName || item.categoryName}</Text>
          <Text style={{ color: gold.textSecondary, fontSize: 12 }}>{item.accountName}</Text>
        </Box>
      </Box>
      <Text style={{ color: isExpense ? gold.red : gold.green, fontWeight: '700', fontSize: 14 }}>
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
  const { data: comparison } = useMonthComparison(start, end);
  const { data: breakdown } = useExpenseCategoryBreakdown(start, end);
  const { data: recent } = useRecentTransactions(4);
  const { data: custodyBalance } = useTotalCustodyBalance();
  const { data: weekly } = useWeeklyTotals(start, end);
  const { data: accountsWithBalances } = useAccountsWithBalances(start, end);
  const { data: goals } = useGoals();
  const upcomingDue = useUpcomingDueCard();

  const income = comparison?.current.income ?? 0;
  const expense = comparison?.current.expense ?? 0;
  const remaining = income - expense;
  const totalBalance = (accountsWithBalances ?? []).reduce((sum, a) => sum + a.balance, 0);
  const topGoal = (goals ?? [])[0];

  const chartData = (breakdown ?? []).map((item, i) => ({
    value: item.total,
    color: item.categoryColor || chartPalette[i % chartPalette.length],
  }));

  const barData = (weekly ?? []).flatMap((w, i) => [
    { value: w.income, label: `${t('dashboard.week')}${i + 1}`, frontColor: gold.green, spacing: 2 },
    { value: w.expense, frontColor: gold.red },
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: gold.bg, paddingTop: insets.top }}>
      <FlatList
        data={recent ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionRow item={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <Box marginBottom="l">
            {/* Header */}
            <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="l">
              <Pressable onPress={() => router.push('/reports')}>
                <Ionicons name="bar-chart" size={24} color={gold.gold} />
              </Pressable>
              <Box flex={1} marginStart="m" alignItems="flex-end">
                <Text style={{ color: gold.textPrimary, fontWeight: '800', fontSize: 18 }}>
                  {userName ? t('dashboard.greeting', { name: userName }) : t('dashboard.greetingGeneric')}
                </Text>
                <Text style={{ color: gold.textSecondary, fontSize: 12 }}>{t('dashboard.subtitle')}</Text>
              </Box>
              <Box width={44} height={44} borderRadius="round" alignItems="center" justifyContent="center" marginStart="m" style={{ backgroundColor: gold.goldSoft, borderWidth: 1.5, borderColor: gold.gold }}>
                <Ionicons name="person" size={20} color={gold.gold} />
              </Box>
            </Box>

            {/* Balance card */}
            <Box borderRadius="l" padding="l" marginBottom="l" style={{ backgroundColor: gold.card, borderWidth: 1, borderColor: gold.cardBorder }}>
              <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="m">
                <Text style={{ color: gold.textSecondary, fontSize: 13 }}>{t('dashboard.currentBalance')}</Text>
                <Ionicons name="eye-outline" size={16} color={gold.textSecondary} />
              </Box>
              <Text style={{ color: gold.gold, fontWeight: '800', fontSize: 32 }}>{formatAmount(totalBalance)}</Text>
              <Pressable onPress={() => router.push('/accounts')} style={{ marginTop: 6, marginBottom: 14 }}>
                <Text style={{ color: gold.gold, fontSize: 12 }}>{t('dashboard.allAccounts')} ›</Text>
              </Pressable>

              <Box height={1} style={{ backgroundColor: gold.divider }} marginBottom="m" />

              <Box flexDirection="row" justifyContent="space-between">
                <Box alignItems="center" flex={1}>
                  <Text style={{ color: gold.textSecondary, fontSize: 11 }}>{t('dashboard.totalExpense')}</Text>
                  <Text style={{ color: gold.red, fontWeight: '700', fontSize: 15 }}>{formatAmount(expense)}</Text>
                  <ChangeChip pct={comparison?.expenseChangePct ?? null} />
                </Box>
                <Box alignItems="center" flex={1}>
                  <Text style={{ color: gold.textSecondary, fontSize: 11 }}>{t('dashboard.income')}</Text>
                  <Text style={{ color: gold.green, fontWeight: '700', fontSize: 15 }}>{formatAmount(income)}</Text>
                  <ChangeChip pct={comparison?.incomeChangePct ?? null} />
                </Box>
                <Box alignItems="center" flex={1}>
                  <Text style={{ color: gold.textSecondary, fontSize: 11 }}>{t('dashboard.remaining')}</Text>
                  <Text style={{ color: gold.gold, fontWeight: '700', fontSize: 15 }}>{formatAmount(remaining)}</Text>
                  <ChangeChip pct={comparison?.remainingChangePct ?? null} />
                </Box>
              </Box>
            </Box>

            {/* Category breakdown */}
            {chartData.length > 0 ? (
              <Box borderRadius="l" padding="l" marginBottom="l" style={{ backgroundColor: gold.card, borderWidth: 1, borderColor: gold.cardBorder }}>
                <Text style={{ color: gold.textPrimary, fontWeight: '700', marginBottom: 12 }}>{t('dashboard.expenseByCategory')}</Text>
                <Box flexDirection="row" alignItems="center">
                  <PieChart data={chartData} donut radius={62} innerRadius={40} centerLabelComponent={() => (
                    <Text style={{ color: gold.textPrimary, fontSize: 11, textAlign: 'center' }}>{formatAmount(expense)}</Text>
                  )} />
                  <Box marginStart="l" style={{ gap: 6 }} flex={1}>
                    {(breakdown ?? []).slice(0, 5).map((item) => (
                      <Box key={item.categoryId} flexDirection="row" alignItems="center" justifyContent="space-between">
                        <Box flexDirection="row" alignItems="center">
                          <Box width={9} height={9} borderRadius="s" marginEnd="s" style={{ backgroundColor: item.categoryColor }} />
                          <Text style={{ color: gold.textSecondary, fontSize: 12 }}>{item.categoryName}</Text>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            ) : null}

            {/* Weekly income/expense */}
            {barData.length > 0 ? (
              <Box borderRadius="l" padding="l" marginBottom="l" style={{ backgroundColor: gold.card, borderWidth: 1, borderColor: gold.cardBorder }}>
                <Text style={{ color: gold.textPrimary, fontWeight: '700', marginBottom: 12 }}>{t('dashboard.monthSummary')}</Text>
                <BarChart
                  data={barData}
                  barWidth={14}
                  spacing={18}
                  roundedTop
                  noOfSections={4}
                  yAxisTextStyle={{ color: gold.textSecondary, fontSize: 9 }}
                  xAxisLabelTextStyle={{ color: gold.textSecondary, fontSize: 10 }}
                  yAxisColor={gold.divider}
                  xAxisColor={gold.divider}
                />
              </Box>
            ) : null}

            {upcomingDue ? (
              <Box borderRadius="m" padding="m" marginBottom="l" style={{ backgroundColor: 'rgba(228,87,76,0.12)' }}>
                <Text style={{ color: gold.red, fontSize: 13 }}>
                  {t('dashboard.dueSoonAlert', { days: upcomingDue.days, cardName: upcomingDue.account.name })}
                </Text>
              </Box>
            ) : null}

            {custodyBalance && custodyBalance > 0 ? (
              <Pressable onPress={() => router.push('/custody')}>
                <Box borderRadius="m" padding="m" marginBottom="l" style={{ backgroundColor: gold.card, borderWidth: 1, borderColor: gold.cardBorder }}>
                  <Text style={{ color: gold.textSecondary, fontSize: 12 }}>{t('custody.underCustody')}</Text>
                  <Text style={{ color: gold.gold, fontWeight: '700', fontSize: 16 }}>{formatAmount(custodyBalance)}</Text>
                </Box>
              </Pressable>
            ) : null}

            <Text style={{ color: gold.textPrimary, fontWeight: '700', marginBottom: 12 }}>{t('dashboard.recentTransactions')}</Text>
          </Box>
        }
        ListFooterComponent={
          <Box flexDirection="row" style={{ gap: 12 }} marginTop="l">
            <Pressable style={{ flex: 1 }} onPress={() => router.push(topGoal ? `/goals/${topGoal.id}` : '/goals')}>
              <Box borderRadius="l" padding="m" style={{ backgroundColor: gold.card, borderWidth: 1, borderColor: gold.cardBorder }}>
                <Text style={{ color: gold.textPrimary, fontWeight: '700', fontSize: 13, marginBottom: 8 }}>{t('dashboard.myGoals')}</Text>
                {topGoal ? (
                  <>
                    <Text style={{ color: gold.textSecondary, fontSize: 11, marginBottom: 6 }}>{topGoal.name}</Text>
                    <Box height={6} borderRadius="s" style={{ backgroundColor: gold.divider }}>
                      <Box height={6} borderRadius="s" style={{ backgroundColor: gold.gold, width: `${Math.min(100, topGoal.pct)}%` }} />
                    </Box>
                    <Text style={{ color: gold.gold, fontSize: 11, marginTop: 6 }}>{Math.round(topGoal.pct)}%</Text>
                  </>
                ) : (
                  <Text style={{ color: gold.textSecondary, fontSize: 11 }}>{t('goals.addGoal')}</Text>
                )}
              </Box>
            </Pressable>

            <Pressable style={{ flex: 1 }} onPress={() => router.push('/accounts')}>
              <Box borderRadius="l" padding="m" style={{ backgroundColor: gold.card, borderWidth: 1, borderColor: gold.cardBorder }}>
                <Text style={{ color: gold.textPrimary, fontWeight: '700', fontSize: 13, marginBottom: 8 }}>{t('dashboard.myAccounts')}</Text>
                {(accountsWithBalances ?? []).slice(0, 3).map((account) => (
                  <Box key={account.id} flexDirection="row" justifyContent="space-between" marginBottom="xs">
                    <Text style={{ color: gold.textSecondary, fontSize: 11 }} numberOfLines={1}>
                      {account.name}
                    </Text>
                    <Text style={{ color: account.balance < 0 ? gold.red : gold.textPrimary, fontSize: 11 }}>{formatAmount(account.balance)}</Text>
                  </Box>
                ))}
              </Box>
            </Pressable>
          </Box>
        }
      />
    </View>
  );
}
