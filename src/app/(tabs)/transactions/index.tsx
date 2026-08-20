import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Chip } from '@/components/Chip';
import { Text } from '@/components/Text';
import { useCategoryTree } from '@/features/categories/hooks';
import { QuickNoteModal } from '@/features/transactions/components/QuickNoteModal';
import { useCategoryMonthTotal, useTransactionsList, useUpdateTransactionNote } from '@/features/transactions/hooks';
import type { TransactionListItem } from '@/features/transactions/types';
import { formatAmount } from '@/lib/currency';
import { getMonthRange } from '@/lib/dates';
import { formatDateForDisplay } from '@/lib/hijri';
import { useDoubleTap } from '@/lib/useDoubleTap';
import { useSettingsStore } from '@/state/useSettingsStore';

type PaymentFilter = 'All' | 'Cash' | 'Card';

function TransactionRow({
  item,
  onOpen,
  onQuickNote,
  onShowCategoryTotal,
}: {
  item: TransactionListItem;
  onOpen: () => void;
  onQuickNote: () => void;
  onShowCategoryTotal: () => void;
}) {
  const { t } = useTranslation();
  const calendar = useSettingsStore((s) => s.calendar);
  const isExpense = item.type === 'Expense';
  const handlePress = useDoubleTap(onOpen, onShowCategoryTotal);

  return (
    <Pressable onPress={handlePress} onLongPress={onQuickNote}>
      <Box flexDirection="row" alignItems="center" backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
        <Box width={40} height={40} borderRadius="round" backgroundColor="chip" alignItems="center" justifyContent="center" marginEnd="m">
          <Text style={{ fontSize: 18 }}>{item.categoryIcon || '📌'}</Text>
        </Box>
        <Box flex={1}>
          <Text variant="subtitle">{item.beneficiaryName || item.categoryName}</Text>
          <Text variant="caption">
            {formatDateForDisplay(item.date, calendar)} · {item.paymentMethodType === 'Cash' ? t('common.cash') : item.cardNickname}
            {item.note ? ' · 📝' : ''}
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

export default function TransactionsListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('All');
  const [categoryFilterId, setCategoryFilterId] = useState<string | null>(null);
  const [quickNoteTarget, setQuickNoteTarget] = useState<TransactionListItem | null>(null);
  const [categoryTotalTarget, setCategoryTotalTarget] = useState<TransactionListItem | null>(null);

  const { data: categoryTree } = useCategoryTree();
  const updateNote = useUpdateTransactionNote();
  const { start, end } = useMemo(() => getMonthRange(), []);

  const categoryIds = useMemo(() => {
    if (!categoryFilterId || !categoryTree) return undefined;
    const main = categoryTree.find((c) => c.id === categoryFilterId);
    if (!main) return [categoryFilterId];
    return [main.id, ...main.children.map((child) => child.id)];
  }, [categoryFilterId, categoryTree]);

  const { data: transactions } = useTransactionsList({
    paymentMethodType: paymentFilter === 'All' ? undefined : paymentFilter,
    categoryIds,
  });

  const { data: categoryTotal } = useCategoryMonthTotal(
    categoryTotalTarget?.categoryId ?? '',
    start,
    end,
    !!categoryTotalTarget
  );

  useEffect(() => {
    if (!categoryTotalTarget || categoryTotal === undefined) return;
    Alert.alert(
      '',
      t('transactions.monthTotalForCategory', {
        category: categoryTotalTarget.categoryName,
        amount: formatAmount(categoryTotal),
      })
    );
    setCategoryTotalTarget(null);
    // categoryTotalTarget is intentionally excluded — this effect fires once when the total for
    // the just-tapped row arrives, not on every categoryTotalTarget identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryTotal]);

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <Box padding="l" paddingBottom="m">
        <Text variant="header" marginBottom="m">
          {t('nav.transactions')}
        </Text>
        <Box flexDirection="row" style={{ gap: 8 }} marginBottom="s">
          {(['All', 'Cash', 'Card'] as PaymentFilter[]).map((option) => (
            <Chip
              key={option}
              label={option === 'All' ? t('common.all') : t(`common.${option.toLowerCase()}`)}
              selected={paymentFilter === option}
              onPress={() => setPaymentFilter(option)}
            />
          ))}
        </Box>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categoryTree ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Chip
              icon={item.icon}
              label={item.name}
              selected={categoryFilterId === item.id}
              onPress={() => setCategoryFilterId(categoryFilterId === item.id ? null : item.id)}
            />
          )}
        />
      </Box>

      <FlatList
        data={transactions ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        renderItem={({ item }) => (
          <TransactionRow
            item={item}
            onOpen={() => router.push(`/transactions/${item.id}/edit`)}
            onQuickNote={() => setQuickNoteTarget(item)}
            onShowCategoryTotal={() => setCategoryTotalTarget(item)}
          />
        )}
      />

      {quickNoteTarget ? (
        <QuickNoteModal
          visible
          initialNote={quickNoteTarget.note ?? ''}
          onClose={() => setQuickNoteTarget(null)}
          onSave={async (note) => {
            await updateNote.mutateAsync({ id: quickNoteTarget.id, note });
            setQuickNoteTarget(null);
          }}
        />
      ) : null}
    </Box>
  );
}
