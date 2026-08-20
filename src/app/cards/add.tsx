import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { CardForm } from '@/features/cards/components/CardForm';
import { useCreateCard } from '@/features/cards/hooks';

export default function AddCardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createCard = useCreateCard();

  return (
    <Box flex={1} backgroundColor="mainBackground">
      <Box padding="l" paddingBottom="none">
        <Text variant="title">{t('cards.addNewCard')}</Text>
      </Box>
      <CardForm
        submitLabel={t('common.save')}
        isSubmitting={createCard.isPending}
        defaultValues={{
          bankId: '',
          cardType: 'Visa',
          cardCategory: 'Credit',
          nickname: '',
          last4Digits: '',
          dueDateDay: null,
          statementDateDay: null,
          creditLimit: null,
        }}
        onSubmit={async (values) => {
          await createCard.mutateAsync(values);
          router.back();
        }}
      />
    </Box>
  );
}
