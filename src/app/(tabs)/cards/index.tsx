import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useCards } from '@/features/cards/hooks';
import type { CardRecord } from '@/features/cards/types';
import { useCashMonthSpend } from '@/features/transactions/hooks';
import { formatAmount } from '@/lib/currency';
import { getMonthRange } from '@/lib/dates';
import { cashCardColor } from '@/theme/cardBrandColors';

function CardTile({ card, onPress }: { card: CardRecord; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable onPress={onPress}>
      <Box backgroundColor="surface" borderRadius="l" padding="l" marginBottom="m" style={{ backgroundColor: card.color }}>
        <Text variant="subtitle" color="textOnDark">
          {card.nickname}
        </Text>
        <Text variant="caption" color="textOnDarkSecondary">
          {card.bankName} • {card.cardCategory === 'Credit' ? t('cards.credit') : t('cards.debit')}
        </Text>
        <Box flexDirection="row" justifyContent="space-between" alignItems="flex-end" marginTop="m">
          <Text variant="body" color="textOnDark">
            **** {card.last4Digits}
          </Text>
          {card.dueDateDay ? (
            <Text variant="caption" color="warning">
              {t('cards.dueDate')}: {card.dueDateDay}
            </Text>
          ) : null}
        </Box>
      </Box>
    </Pressable>
  );
}

export default function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: cards } = useCards();
  const { start, end } = useMemo(() => getMonthRange(), []);
  const { data: cashSpend } = useCashMonthSpend(start, end);

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <FlatList
        data={cards ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => <CardTile card={item} onPress={() => router.push(`/cards/${item.id}`)} />}
        ListHeaderComponent={
          <>
            <Text variant="header" marginBottom="l">
              {t('cards.paymentMethods')}
            </Text>
            <Box backgroundColor="surface" borderRadius="l" padding="l" marginBottom="m" style={{ backgroundColor: cashCardColor }}>
              <Text variant="subtitle" color="textOnDark">
                {t('common.cash')}
              </Text>
              <Text variant="caption" color="textOnDarkSecondary">
                {t('cards.cashSpendThisMonth', { amount: formatAmount(cashSpend ?? 0) })}
              </Text>
            </Box>
          </>
        }
        ListFooterComponent={
          <Pressable onPress={() => router.push('/cards/add')}>
            <Box borderRadius="l" borderWidth={1} borderStyle="dashed" borderColor="accent" padding="l" alignItems="center">
              <Text variant="subtitle" color="accent">
                {t('cards.addNewCard')} +
              </Text>
            </Box>
          </Pressable>
        }
      />
    </Box>
  );
}
