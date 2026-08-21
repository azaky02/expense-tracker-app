import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, TextInput } from 'react-native';

import { Box } from '@/components/Box';
import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Text } from '@/components/Text';
import { useAccounts } from '@/features/accounts/hooks';
import { useCreateTransfer } from '@/features/transfers/hooks';
import { transferFormSchema, type TransferFormValues } from '@/features/transfers/validators';
import { useAppTheme } from '@/theme/ThemeProvider';

export default function AddTransferScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const { data: accounts } = useAccounts();
  const createTransfer = useCreateTransfer();

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: { fromAccountId: '', toAccountId: '', amount: 0, date: new Date().toISOString().slice(0, 10), note: '' },
  });

  const fromAccountId = watch('fromAccountId');
  const toAccountId = watch('toAccountId');

  const submit = handleSubmit(async (values) => {
    await createTransfer.mutateAsync(values);
    router.back();
  });

  return (
    <Box flex={1} backgroundColor="mainBackground">
      <Box padding="l" paddingBottom="none">
        <Text variant="title">{t('transfers.addTransfer')}</Text>
      </Box>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Text variant="caption" marginBottom="xs">
          {t('transfers.fromAccount')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {(accounts ?? []).map((account) => (
            <Chip key={account.id} label={account.name} selected={fromAccountId === account.id} onPress={() => setValue('fromAccountId', account.id, { shouldValidate: true })} />
          ))}
        </ScrollView>
        {errors.fromAccountId ? (
          <Text variant="caption" color="danger" marginTop="s">
            {errors.fromAccountId.message}
          </Text>
        ) : null}

        <Text variant="caption" marginTop="l" marginBottom="xs">
          {t('transfers.toAccount')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {(accounts ?? []).map((account) => (
            <Chip key={account.id} label={account.name} selected={toAccountId === account.id} onPress={() => setValue('toAccountId', account.id, { shouldValidate: true })} />
          ))}
        </ScrollView>
        {errors.toAccountId ? (
          <Text variant="caption" color="danger" marginTop="s">
            {errors.toAccountId.message}
          </Text>
        ) : null}

        <Text variant="caption" marginTop="l" marginBottom="xs">
          {t('transactions.amount')}
        </Text>
        <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l">
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={(text) => setValue('amount', Number(text) || 0, { shouldValidate: true })}
            style={{ color: theme.colors.textPrimary }}
          />
        </Box>
        {errors.amount ? (
          <Text variant="caption" color="danger" marginBottom="s">
            {errors.amount.message}
          </Text>
        ) : null}

        <Text variant="caption" marginBottom="xs">
          {t('transactions.notes')}
        </Text>
        <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l">
          <TextInput onChangeText={(text) => setValue('note', text)} style={{ color: theme.colors.textPrimary }} multiline />
        </Box>

        <PrimaryButton label={t('common.save')} onPress={submit} loading={createTransfer.isPending} />
      </ScrollView>
    </Box>
  );
}
