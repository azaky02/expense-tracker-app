import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useSearchTransactions } from '@/features/search/hooks';
import type { TransactionListItem } from '@/features/transactions/types';
import { formatAmount } from '@/lib/currency';
import { useAppTheme } from '@/theme/ThemeProvider';

function ResultRow({ item, onPress }: { item: TransactionListItem; onPress: () => void }) {
  const isExpense = item.type === 'Expense';
  return (
    <Pressable onPress={onPress}>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
        <Box>
          <Text variant="subtitle">{item.beneficiaryName || item.categoryName}</Text>
          <Text variant="caption">
            {item.date} · {item.accountName}
          </Text>
        </Box>
        <Text variant={isExpense ? 'amountNegative' : 'amountPositive'}>
          {isExpense ? '-' : '+'}
          {formatAmount(item.amount)}
        </Text>
      </Box>
    </Pressable>
  );
}

export default function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { data: results } = useSearchTransactions(query);

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <Box padding="l" paddingBottom="m">
        <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m">
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.placeholder')}
            placeholderTextColor={theme.colors.textSecondary}
            style={{ color: theme.colors.textPrimary }}
            autoFocus
          />
        </Box>
      </Box>
      <FlatList
        data={results ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        renderItem={({ item }) => <ResultRow item={item} onPress={() => router.push(`/transactions/${item.id}/edit`)} />}
      />
    </Box>
  );
}
