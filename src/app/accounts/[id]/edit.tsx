import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { AccountForm } from '@/features/accounts/components/AccountForm';
import { useAccount, useUpdateAccount } from '@/features/accounts/hooks';

export default function EditAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: account, isLoading } = useAccount(id);
  const updateAccount = useUpdateAccount();

  if (isLoading || !account) {
    return <Box flex={1} backgroundColor="mainBackground" />;
  }

  return (
    <Box flex={1} backgroundColor="mainBackground">
      <Box padding="l" paddingBottom="none">
        <Text variant="title">{t('accounts.editAccount')}</Text>
      </Box>
      <AccountForm
        submitLabel={t('common.save')}
        isSubmitting={updateAccount.isPending}
        defaultValues={{
          type: account.type,
          name: account.name,
          bankId: account.bankId,
          cardType: account.cardType,
          last4Digits: account.last4Digits,
          dueDateDay: account.dueDateDay,
          statementDateDay: account.statementDateDay,
          creditLimit: account.creditLimit,
        }}
        onSubmit={async (values) => {
          await updateAccount.mutateAsync({ id, input: values });
          router.back();
        }}
      />
    </Box>
  );
}
