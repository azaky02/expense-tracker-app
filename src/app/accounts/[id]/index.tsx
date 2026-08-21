import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useAccount, useDeactivateAccount } from '@/features/accounts/hooks';
import { useAccountMonthSpend, useAccountTransactions } from '@/features/transactions/hooks';
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

export default function AccountDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: account } = useAccount(id);
  const { data: transactions } = useAccountTransactions(id);
  const { start, end } = useMemo(() => getMonthRange(), []);
  const { data: monthSpend } = useAccountMonthSpend(id, start, end);
  const deactivateAccount = useDeactivateAccount();

  function handleDeactivate() {
    Alert.alert(t('accounts.deactivateAccount'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('accounts.deactivateAccount'),
        style: 'destructive',
        onPress: async () => {
          await deactivateAccount.mutateAsync(id);
          router.back();
        },
      },
    ]);
  }

  if (!account) {
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
              {t('accounts.accountDetails')}
            </Text>
            <Box borderRadius="l" padding="l" marginBottom="m" style={{ backgroundColor: account.color }}>
              <Text variant="subtitle" color="textOnDark">
                {account.name}
              </Text>
              <Text variant="caption" color="textOnDarkSecondary">
                {account.bankName ? `${account.bankName} • ` : ''}
                {t(`accounts.types.${account.type}`)}
              </Text>
              {account.last4Digits ? (
                <Text variant="body" color="textOnDark" style={{ marginTop: 12 }}>
                  •••• •••• •••• {account.last4Digits}
                </Text>
              ) : null}
              {account.creditLimit ? (
                <Text variant="caption" color="textOnDarkSecondary" style={{ marginTop: 8 }}>
                  {t('cards.creditLimit')}: {formatAmount(account.creditLimit)}
                </Text>
              ) : null}
            </Box>

            <Box flexDirection="row" style={{ gap: 12 }} marginBottom="l">
              {account.dueDateDay ? (
                <Box flex={1} backgroundColor="warningSurface" borderRadius="m" padding="m">
                  <Text variant="caption" color="warning">
                    {t('cards.dueDate')}
                  </Text>
                  <Text variant="subtitle" color="warning">
                    {account.dueDateDay}
                  </Text>
                </Box>
              ) : null}
              <Box flex={1} backgroundColor="surfaceAlt" borderRadius="m" padding="m">
                <Text variant="caption">{t('cards.spendThisMonth')}</Text>
                <Text variant="subtitle">{formatAmount(monthSpend ?? 0)}</Text>
              </Box>
            </Box>

            <Text variant="subtitle" marginBottom="m">
              {t('accounts.accountTransactions')}
            </Text>
          </Box>
        }
        ListFooterComponent={
          <Box style={{ gap: 8 }} marginTop="m">
            <Pressable onPress={() => router.push(`/accounts/${id}/edit`)}>
              <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" alignItems="center">
                <Text variant="subtitle">⚙ {t('accounts.editAccount')}</Text>
              </Box>
            </Pressable>
            {!account.isDefault ? (
              <Pressable onPress={handleDeactivate}>
                <Box backgroundColor="dangerSurface" borderRadius="m" padding="m" alignItems="center">
                  <Text variant="subtitle" color="danger">
                    {t('accounts.deactivateAccount')}
                  </Text>
                </Box>
              </Pressable>
            ) : null}
          </Box>
        }
      />
    </Box>
  );
}
