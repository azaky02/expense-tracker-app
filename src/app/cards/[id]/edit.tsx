import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { CardForm } from '@/features/cards/components/CardForm';
import { useCard, useUpdateCard } from '@/features/cards/hooks';

export default function EditCardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: card, isLoading } = useCard(id);
  const updateCard = useUpdateCard();

  if (isLoading || !card) {
    return <Box flex={1} backgroundColor="mainBackground" />;
  }

  return (
    <Box flex={1} backgroundColor="mainBackground">
      <Box padding="l" paddingBottom="none">
        <Text variant="title">{t('cards.editCard')}</Text>
      </Box>
      <CardForm
        submitLabel={t('common.save')}
        isSubmitting={updateCard.isPending}
        defaultValues={{
          bankId: card.bankId,
          cardType: card.cardType,
          cardCategory: card.cardCategory,
          nickname: card.nickname,
          last4Digits: card.last4Digits,
          dueDateDay: card.dueDateDay,
          statementDateDay: card.statementDateDay,
          creditLimit: card.creditLimit,
        }}
        onSubmit={async (values) => {
          await updateCard.mutateAsync({ id, input: values });
          router.back();
        }}
      />
    </Box>
  );
}
