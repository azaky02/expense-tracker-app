import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useAccountsWithBalances } from '@/features/accounts/hooks';
import type { AccountWithBalance } from '@/features/accounts/types';
import { formatAmount } from '@/lib/currency';
import { getMonthRange } from '@/lib/dates';

function AccountTile({ account, onPress }: { account: AccountWithBalance; onPress: () => void }) {
  const { t } = useTranslation();
  const isCardLike = account.type === 'CreditCard' || account.type === 'DebitCard';
  return (
    <Pressable onPress={onPress}>
      <Box backgroundColor="surface" borderRadius="l" padding="l" marginBottom="m" style={{ backgroundColor: account.color }}>
        <Text variant="subtitle" color="textOnDark">
          {account.name}
        </Text>
        <Text variant="caption" color="textOnDarkSecondary">
          {account.bankName ? `${account.bankName} • ` : ''}
          {t(`accounts.types.${account.type}`)}
        </Text>
        <Box flexDirection="row" justifyContent="space-between" alignItems="flex-end" marginTop="m">
          <Text variant="body" color="textOnDark">
            {isCardLike && account.last4Digits ? `**** ${account.last4Digits}` : formatAmount(account.balance)}
          </Text>
          {account.dueDateDay ? (
            <Text variant="caption" color="warning">
              {t('cards.dueDate')}: {account.dueDateDay}
            </Text>
          ) : null}
        </Box>
      </Box>
    </Pressable>
  );
}

export default function AccountsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { start, end } = useMemo(() => getMonthRange(), []);
  const { data: accounts } = useAccountsWithBalances(start, end);

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <FlatList
        data={accounts ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => <AccountTile account={item} onPress={() => router.push(`/accounts/${item.id}`)} />}
        ListHeaderComponent={
          <Text variant="header" marginBottom="l">
            {t('accounts.title')}
          </Text>
        }
        ListFooterComponent={
          <Pressable onPress={() => router.push('/accounts/add')}>
            <Box borderRadius="l" borderWidth={1} borderStyle="dashed" borderColor="accent" padding="l" alignItems="center">
              <Text variant="subtitle" color="accent">
                {t('accounts.addNewAccount')} +
              </Text>
            </Box>
          </Pressable>
        }
      />
    </Box>
  );
}
