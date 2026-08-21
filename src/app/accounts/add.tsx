import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { AccountForm } from '@/features/accounts/components/AccountForm';
import { useCreateAccount } from '@/features/accounts/hooks';

export default function AddAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createAccount = useCreateAccount();

  return (
    <Box flex={1} backgroundColor="mainBackground">
      <Box padding="l" paddingBottom="none">
        <Text variant="title">{t('accounts.addNewAccount')}</Text>
      </Box>
      <AccountForm
        submitLabel={t('common.save')}
        isSubmitting={createAccount.isPending}
        defaultValues={{
          type: 'CashWallet',
          name: '',
          bankId: null,
          cardType: 'Visa',
          last4Digits: '',
          dueDateDay: null,
          statementDateDay: null,
          creditLimit: null,
        }}
        onSubmit={async (values) => {
          await createAccount.mutateAsync(values);
          router.back();
        }}
      />
    </Box>
  );
}
