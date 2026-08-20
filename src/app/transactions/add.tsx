import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';
import { useCreateTransaction } from '@/features/transactions/hooks';
import { todayIso } from '@/lib/dates';

export default function AddTransactionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createTransaction = useCreateTransaction();

  return (
    <Box flex={1} backgroundColor="mainBackground">
      <Box padding="l" paddingBottom="none">
        <Text variant="title">{t('transactions.addTitle')}</Text>
      </Box>
      <TransactionForm
        submitLabel={t('transactions.saveTransaction')}
        isSubmitting={createTransaction.isPending}
        defaultValues={{
          amount: 0,
          type: 'Expense',
          categoryId: '',
          paymentMethodType: 'Cash',
          cardId: null,
          date: todayIso(),
          note: '',
          attachmentUri: null,
          beneficiaryName: '',
        }}
        onSubmit={async (values) => {
          await createTransaction.mutateAsync(values);
          router.back();
        }}
      />
    </Box>
  );
}
