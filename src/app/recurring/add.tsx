import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, TextInput } from 'react-native';

import { Box } from '@/components/Box';
import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SegmentedToggle } from '@/components/SegmentedToggle';
import { Text } from '@/components/Text';
import { useAccounts } from '@/features/accounts/hooks';
import { useCategoryTree } from '@/features/categories/hooks';
import { DatePickerModal } from '@/features/dates/components/DatePickerModal';
import { useCreateRecurringRule } from '@/features/recurring/hooks';
import { recurringFormSchema, type RecurringFormValues } from '@/features/recurring/validators';
import { todayIso } from '@/lib/dates';
import { formatDateForDisplay } from '@/lib/hijri';
import { useSettingsStore } from '@/state/useSettingsStore';
import { useAppTheme } from '@/theme/ThemeProvider';

const FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom'] as const;

export default function AddRecurringScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const calendar = useSettingsStore((s) => s.calendar);
  const createRule = useCreateRecurringRule();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: {
      name: '',
      type: 'Expense',
      categoryId: '',
      accountId: '',
      amount: 0,
      frequency: 'Monthly',
      startDate: todayIso(),
    },
  });

  const type = watch('type');
  const categoryId = watch('categoryId');
  const accountId = watch('accountId');
  const frequency = watch('frequency');
  const startDate = watch('startDate');

  const { data: categoryTree } = useCategoryTree(type);
  const { data: accounts } = useAccounts();

  const submit = handleSubmit(async (values) => {
    await createRule.mutateAsync(values);
    router.back();
  });

  return (
    <Box flex={1} backgroundColor="mainBackground">
      <Box padding="l" paddingBottom="none">
        <Text variant="title">{t('recurring.addRule')}</Text>
      </Box>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Text variant="caption" marginBottom="xs">
          {t('recurring.name')}
        </Text>
        <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l">
          <TextInput onChangeText={(text) => setValue('name', text)} style={{ color: theme.colors.textPrimary }} />
        </Box>
        {errors.name ? (
          <Text variant="caption" color="danger" marginBottom="s">
            {errors.name.message}
          </Text>
        ) : null}

        <Box marginBottom="l">
          <SegmentedToggle
            value={type}
            onChange={(value) => {
              setValue('type', value);
              setValue('categoryId', '');
            }}
            selectedColor="expense"
            options={[
              { value: 'Expense', label: t('transactions.expense') },
              { value: 'Income', label: t('transactions.income') },
            ]}
          />
        </Box>

        <Text variant="caption" marginBottom="xs">
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
          {t('transactions.category')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
          {(categoryTree ?? []).map((main) => (
            <Chip key={main.id} icon={main.icon} label={main.name} selected={categoryId === main.id} onPress={() => setValue('categoryId', main.id, { shouldValidate: true })} />
          ))}
        </ScrollView>

        <Text variant="caption" marginBottom="xs">
          {t('transactions.account')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
          {(accounts ?? []).map((account) => (
            <Chip key={account.id} label={account.name} selected={accountId === account.id} onPress={() => setValue('accountId', account.id, { shouldValidate: true })} />
          ))}
        </ScrollView>

        <Text variant="caption" marginBottom="xs">
          {t('recurring.frequency')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
          {FREQUENCIES.map((option) => (
            <Chip key={option} label={t(`recurring.frequencies.${option}`)} selected={frequency === option} onPress={() => setValue('frequency', option)} />
          ))}
        </ScrollView>

        {frequency === 'Custom' ? (
          <>
            <Text variant="caption" marginBottom="xs">
              {t('recurring.intervalDays')}
            </Text>
            <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l">
              <TextInput
                keyboardType="number-pad"
                onChangeText={(text) => setValue('intervalDays', Number(text) || 1)}
                style={{ color: theme.colors.textPrimary }}
              />
            </Box>
          </>
        ) : null}

        <Text variant="caption" marginBottom="xs">
          {t('recurring.startDate')}
        </Text>
        <Pressable onPress={() => setShowDatePicker(true)}>
          <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l" flexDirection="row" justifyContent="space-between" alignItems="center">
            <Text variant="body">{formatDateForDisplay(startDate, calendar)}</Text>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
          </Box>
        </Pressable>
        <DatePickerModal
          visible={showDatePicker}
          isoDate={startDate}
          onClose={() => setShowDatePicker(false)}
          onSelect={(iso) => {
            setValue('startDate', iso, { shouldValidate: true });
            setShowDatePicker(false);
          }}
        />

        <PrimaryButton label={t('common.save')} onPress={submit} loading={createRule.isPending} />
      </ScrollView>
    </Box>
  );
}
