import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useCreateCustodyRecord } from '@/features/custody/hooks';
import { findOrCreatePerson } from '@/features/people/api';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';
import { useCreateTransaction } from '@/features/transactions/hooks';
import { toTransactionInput } from '@/features/transactions/submission';
import { todayIso } from '@/lib/dates';

export default function AddTransactionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createTransaction = useCreateTransaction();
  const createCustodyRecord = useCreateCustodyRecord();

  return (
    <Box flex={1} backgroundColor="mainBackground">
      <Box padding="l" paddingBottom="none">
        <Text variant="title">{t('transactions.addTitle')}</Text>
      </Box>
      <TransactionForm
        submitLabel={t('transactions.saveTransaction')}
        isSubmitting={createTransaction.isPending || createCustodyRecord.isPending}
        defaultValues={{
          amount: 0,
          type: 'Expense',
          categoryId: '',
          accountId: null,
          incomeTypeUi: null,
          date: todayIso(),
          note: '',
          attachmentUri: null,
          beneficiaryName: '',
          personName: '',
          reason: '',
        }}
        onSubmit={async (values) => {
          if (values.type === 'Income' && values.incomeTypeUi === 'Custody') {
            const personId = await findOrCreatePerson(values.personName ?? '');
            await createCustodyRecord.mutateAsync({
              personId,
              reason: values.reason,
              originalAmount: values.amount,
              receivedDate: values.date,
            });
          } else {
            await createTransaction.mutateAsync(await toTransactionInput(values));
          }
          router.back();
        }}
      />
    </Box>
  );
}
