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
import { Text } from '@/components/Text';
import { useAccounts } from '@/features/accounts/hooks';
import { DatePickerModal } from '@/features/dates/components/DatePickerModal';
import { useCreateGoal } from '@/features/goals/hooks';
import { goalFormSchema, type GoalFormValues } from '@/features/goals/validators';
import { todayIso } from '@/lib/dates';
import { formatDateForDisplay } from '@/lib/hijri';
import { useSettingsStore } from '@/state/useSettingsStore';
import { useAppTheme } from '@/theme/ThemeProvider';

export default function AddGoalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const calendar = useSettingsStore((s) => s.calendar);
  const { data: accounts } = useAccounts();
  const createGoal = useCreateGoal();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: { name: '', targetAmount: 0, targetDate: null, linkedAccountId: '' },
  });

  const linkedAccountId = watch('linkedAccountId');
  const targetDate = watch('targetDate');

  const submit = handleSubmit(async (values) => {
    await createGoal.mutateAsync(values);
    router.back();
  });

  return (
    <Box flex={1} backgroundColor="mainBackground">
      <Box padding="l" paddingBottom="none">
        <Text variant="title">{t('goals.addGoal')}</Text>
      </Box>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Text variant="caption" marginBottom="xs">
          {t('goals.name')}
        </Text>
        <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l">
          <TextInput onChangeText={(text) => setValue('name', text)} style={{ color: theme.colors.textPrimary }} />
        </Box>
        {errors.name ? (
          <Text variant="caption" color="danger" marginBottom="s">
            {errors.name.message}
          </Text>
        ) : null}

        <Text variant="caption" marginBottom="xs">
          {t('goals.targetAmount')}
        </Text>
        <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l">
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={(text) => setValue('targetAmount', Number(text) || 0, { shouldValidate: true })}
            style={{ color: theme.colors.textPrimary }}
          />
        </Box>
        {errors.targetAmount ? (
          <Text variant="caption" color="danger" marginBottom="s">
            {errors.targetAmount.message}
          </Text>
        ) : null}

        <Text variant="caption" marginBottom="xs">
          {t('goals.linkedAccount')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
          {(accounts ?? []).map((account) => (
            <Chip key={account.id} label={account.name} selected={linkedAccountId === account.id} onPress={() => setValue('linkedAccountId', account.id, { shouldValidate: true })} />
          ))}
        </ScrollView>
        {errors.linkedAccountId ? (
          <Text variant="caption" color="danger" marginBottom="s">
            {errors.linkedAccountId.message}
          </Text>
        ) : null}

        <Text variant="caption" marginBottom="xs">
          {t('goals.targetDate')} ({t('common.optional')})
        </Text>
        <Pressable onPress={() => setShowDatePicker(true)}>
          <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l" flexDirection="row" justifyContent="space-between" alignItems="center">
            <Text variant="body">{targetDate ? formatDateForDisplay(targetDate, calendar) : t('common.optional')}</Text>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
          </Box>
        </Pressable>
        <DatePickerModal
          visible={showDatePicker}
          isoDate={targetDate ?? todayIso()}
          onClose={() => setShowDatePicker(false)}
          onSelect={(iso) => {
            setValue('targetDate', iso, { shouldValidate: true });
            setShowDatePicker(false);
          }}
        />

        <PrimaryButton label={t('common.save')} onPress={submit} loading={createGoal.isPending} />
      </ScrollView>
    </Box>
  );
}
