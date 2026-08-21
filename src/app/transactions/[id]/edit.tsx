import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable } from 'react-native';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';
import { useDeleteTransaction, useTransaction, useUpdateTransaction } from '@/features/transactions/hooks';
import { toTransactionInput } from '@/features/transactions/submission';
import { deleteAttachment } from '@/lib/attachments';

export default function EditTransactionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: transaction, isLoading } = useTransaction(id);
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  function handleDelete() {
    Alert.alert(t('common.delete'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteAttachment(transaction?.attachmentUri);
          await deleteTransaction.mutateAsync(id);
          router.back();
        },
      },
    ]);
  }

  if (isLoading || !transaction) {
    return <Box flex={1} backgroundColor="mainBackground" />;
  }

  return (
    <Box flex={1} backgroundColor="mainBackground">
      <Box padding="l" paddingBottom="none" flexDirection="row" justifyContent="space-between" alignItems="center">
        <Text variant="title">{t('common.edit')}</Text>
        <Pressable onPress={handleDelete}>
          <Text variant="body" color="danger">
            {t('common.delete')}
          </Text>
        </Pressable>
      </Box>
      <TransactionForm
        submitLabel={t('common.save')}
        isSubmitting={updateTransaction.isPending}
        defaultValues={{
          amount: transaction.amount,
          type: transaction.type,
          categoryId: transaction.categoryId,
          accountId: transaction.accountId,
          incomeTypeUi: transaction.incomeType,
          date: transaction.date,
          note: transaction.note ?? '',
          attachmentUri: transaction.attachmentUri,
          beneficiaryName: transaction.beneficiaryName ?? '',
        }}
        onSubmit={async (values) => {
          await updateTransaction.mutateAsync({ id, input: await toTransactionInput(values) });
          router.back();
        }}
      />
    </Box>
  );
}
