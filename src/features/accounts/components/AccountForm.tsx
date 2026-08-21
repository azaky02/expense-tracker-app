import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, TextInput } from 'react-native';

import { Box } from '@/components/Box';
import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Text } from '@/components/Text';
import { useBanks, useCreateCustomBank } from '@/features/banks/hooks';
import { useAppTheme } from '@/theme/ThemeProvider';

import { accountFormSchema, type AccountFormValues } from '../validators';
import type { AccountType } from '../types';

interface AccountFormProps {
  defaultValues: AccountFormValues;
  onSubmit: (values: AccountFormValues) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
}

const ACCOUNT_TYPES: AccountType[] = ['CashWallet', 'BankAccount', 'DigitalWallet', 'SavingsAccount', 'CreditCard', 'DebitCard'];

export function AccountForm({ defaultValues, onSubmit, submitLabel, isSubmitting }: AccountFormProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { data: banks } = useBanks();
  const createBank = useCreateCustomBank();
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBankName, setNewBankName] = useState('');

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountFormValues>({ resolver: zodResolver(accountFormSchema), defaultValues });

  const type = watch('type');
  const bankId = watch('bankId');
  const cardType = watch('cardType');
  const isCardLike = type === 'CreditCard' || type === 'DebitCard';
  const needsBank = type === 'BankAccount' || isCardLike;

  async function handleAddBank() {
    if (!newBankName.trim()) return;
    const id = await createBank.mutateAsync(newBankName);
    setValue('bankId', id, { shouldValidate: true });
    setNewBankName('');
    setShowAddBank(false);
  }

  const submit = handleSubmit(onSubmit);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <Text variant="caption" marginBottom="xs">
        {t('accounts.type')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {ACCOUNT_TYPES.map((option) => (
          <Chip key={option} label={t(`accounts.types.${option}`)} selected={type === option} onPress={() => setValue('type', option, { shouldValidate: true })} />
        ))}
      </ScrollView>

      <Text variant="caption" marginTop="l" marginBottom="xs">
        {t('accounts.name')}
      </Text>
      <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l">
        <TextInput
          defaultValue={defaultValues.name}
          onChangeText={(text) => setValue('name', text)}
          style={{ color: theme.colors.textPrimary }}
        />
      </Box>
      {errors.name ? (
        <Text variant="caption" color="danger" marginBottom="s">
          {errors.name.message}
        </Text>
      ) : null}

      {needsBank ? (
        <>
          <Text variant="caption" marginBottom="xs">
            {t('cards.bank')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {(banks ?? []).map((bank) => (
              <Chip key={bank.id} label={bank.name} selected={bankId === bank.id} onPress={() => setValue('bankId', bank.id, { shouldValidate: true })} />
            ))}
            <Chip label={`+ ${t('cards.bank')}`} selected={showAddBank} onPress={() => setShowAddBank((v) => !v)} />
          </ScrollView>
          {errors.bankId ? (
            <Text variant="caption" color="danger" marginTop="s">
              {errors.bankId.message}
            </Text>
          ) : null}
          {showAddBank ? (
            <Box flexDirection="row" alignItems="center" marginTop="s" style={{ gap: 8 }}>
              <Box flex={1} backgroundColor="surfaceAlt" borderRadius="m" padding="m">
                <TextInput value={newBankName} onChangeText={setNewBankName} style={{ color: theme.colors.textPrimary }} />
              </Box>
              <PrimaryButton label={t('common.add')} onPress={handleAddBank} />
            </Box>
          ) : null}
        </>
      ) : null}

      {isCardLike ? (
        <>
          <Box marginTop="l" marginBottom="l">
            <Text variant="caption" marginBottom="xs">
              {t('cards.cardType')}
            </Text>
            <Box flexDirection="row" style={{ gap: 8 }}>
              {(['Visa', 'Mastercard', 'Meeza'] as const).map((option) => (
                <Chip key={option} label={option} selected={cardType === option} onPress={() => setValue('cardType', option)} />
              ))}
            </Box>
          </Box>

          <Text variant="caption" marginBottom="xs">
            {t('cards.last4Digits')}
          </Text>
          <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l">
            <TextInput
              defaultValue={defaultValues.last4Digits ?? ''}
              keyboardType="number-pad"
              maxLength={4}
              onChangeText={(text) => setValue('last4Digits', text)}
              style={{ color: theme.colors.textPrimary }}
            />
          </Box>
          {errors.last4Digits ? (
            <Text variant="caption" color="danger" marginBottom="s">
              {errors.last4Digits.message}
            </Text>
          ) : null}
        </>
      ) : null}

      {type === 'CreditCard' ? (
        <>
          <Text variant="caption" marginBottom="xs">
            {t('cards.dueDate')} (1-31)
          </Text>
          <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l">
            <TextInput
              defaultValue={defaultValues.dueDateDay ? String(defaultValues.dueDateDay) : ''}
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={(text) => setValue('dueDateDay', Number(text) || null, { shouldValidate: true })}
              style={{ color: theme.colors.textPrimary }}
            />
          </Box>
          {errors.dueDateDay ? (
            <Text variant="caption" color="danger" marginBottom="s">
              {errors.dueDateDay.message}
            </Text>
          ) : null}

          <Text variant="caption" marginBottom="xs">
            {t('cards.creditLimit')} ({t('common.optional')})
          </Text>
          <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l">
            <TextInput
              defaultValue={defaultValues.creditLimit ? String(defaultValues.creditLimit) : ''}
              keyboardType="decimal-pad"
              onChangeText={(text) => setValue('creditLimit', Number(text) || null)}
              style={{ color: theme.colors.textPrimary }}
            />
          </Box>
        </>
      ) : null}

      <PrimaryButton label={submitLabel} onPress={submit} loading={isSubmitting} />
    </ScrollView>
  );
}
