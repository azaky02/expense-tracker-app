import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useOpenCustodyRecords } from '@/features/custody/hooks';
import type { CustodyRecordRecord } from '@/features/custody/types';
import { formatAmount } from '@/lib/currency';

function statusColor(status: CustodyRecordRecord['status']) {
  if (status === 'Closed') return 'textSecondary';
  if (status === 'PartiallyReturned') return 'warning';
  return 'accent';
}

function CustodyRow({ item, onPress }: { item: CustodyRecordRecord; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable onPress={onPress}>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
        <Box>
          <Text variant="subtitle">{item.personName}</Text>
          <Text variant="caption" color={statusColor(item.status)}>
            {t(`custody.status.${item.status}`)}
          </Text>
        </Box>
        <Text variant="subtitle">{formatAmount(item.remainingAmount)}</Text>
      </Box>
    </Pressable>
  );
}

export default function CustodyListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: records } = useOpenCustodyRecords();

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <FlatList
        data={records ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => <CustodyRow item={item} onPress={() => router.push(`/custody/${item.id}`)} />}
        ListHeaderComponent={
          <Text variant="header" marginBottom="l">
            {t('custody.title')}
          </Text>
        }
      />
    </Box>
  );
}
