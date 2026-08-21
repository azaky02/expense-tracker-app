import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useUpcomingPayments } from '@/features/bills/hooks';
import type { UpcomingPaymentItem } from '@/features/bills/types';
import { formatAmount } from '@/lib/currency';
import { todayIso } from '@/lib/dates';

function daysUntil(iso: string): number {
  const today = new Date(todayIso());
  const target = new Date(iso);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function BillRow({ item }: { item: UpcomingPaymentItem }) {
  const { t } = useTranslation();
  const days = daysUntil(item.date);
  return (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between" backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
      <Box>
        <Text variant="subtitle">{item.label}</Text>
        <Text variant="caption">{t('bills.inDays', { days })}</Text>
      </Box>
      {item.amount != null ? <Text variant="subtitle">{formatAmount(item.amount)}</Text> : null}
    </Box>
  );
}

export default function BillsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: items } = useUpcomingPayments(30);

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <FlatList
        data={items ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => <BillRow item={item} />}
        ListHeaderComponent={
          <Text variant="header" marginBottom="l">
            {t('bills.title')}
          </Text>
        }
      />
    </Box>
  );
}
