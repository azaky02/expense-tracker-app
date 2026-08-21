import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, ScrollView, TextInput } from 'react-native';

import { Box } from '@/components/Box';
import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SegmentedToggle } from '@/components/SegmentedToggle';
import { Text } from '@/components/Text';
import { useAccounts } from '@/features/accounts/hooks';
import { BeneficiaryPicker } from '@/features/beneficiaries/components/BeneficiaryPicker';
import { useDefaultBeneficiaryName } from '@/features/beneficiaries/hooks';
import { CategoryPicker } from '@/features/categories/components/CategoryPicker';
import { DatePickerModal } from '@/features/dates/components/DatePickerModal';
import { deleteAttachment, persistAttachment } from '@/lib/attachments';
import { formatDateForDisplay } from '@/lib/hijri';
import { useSettingsStore } from '@/state/useSettingsStore';
import { useAppTheme } from '@/theme/ThemeProvider';

import { incomeTypeUiSchema, transactionFormSchema, type TransactionFormValues } from '../validators';

interface TransactionFormProps {
  defaultValues: TransactionFormValues;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
}

const INCOME_TYPES = incomeTypeUiSchema.options;

/** Small single-line input used across the compact income sub-fields — kept local since it's
 * only ever a label + one-line TextInput pair, repeated for Salary/CashReceipt/etc. */
function CompactField({
  label,
  optional,
  onChangeText,
  error,
}: {
  label: string;
  optional?: boolean;
  onChangeText: (text: string) => void;
  error?: string;
}) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  return (
    <Box flex={1}>
      <Text variant="caption" numberOfLines={1}>
        {label}
        {optional ? ` (${t('common.optional')})` : ''}
      </Text>
      <Box backgroundColor="surfaceAlt" borderRadius="s" paddingHorizontal="s" style={{ height: 36, justifyContent: 'center' }}>
        <TextInput onChangeText={onChangeText} style={{ color: theme.colors.textPrimary, fontSize: 13 }} />
      </Box>
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}
    </Box>
  );
}

export function TransactionForm({ defaultValues, onSubmit, submitLabel, isSubmitting }: TransactionFormProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const calendar = useSettingsStore((s) => s.calendar);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues,
  });

  const type = watch('type');
  const accountId = watch('accountId');
  const incomeTypeUi = watch('incomeTypeUi');
  const categoryId = watch('categoryId');
  const attachmentUri = watch('attachmentUri');
  const beneficiaryName = watch('beneficiaryName');
  const amount = watch('amount');
  const date = watch('date');

  const { data: accounts } = useAccounts();
  const { data: defaultBeneficiaryName } = useDefaultBeneficiaryName();

  const isCustody = type === 'Income' && incomeTypeUi === 'Custody';

  // Pre-fill the default beneficiary once, only on a fresh Add (never overwrite an edit's value).
  useEffect(() => {
    if (!defaultValues.beneficiaryName && defaultBeneficiaryName && !beneficiaryName) {
      setValue('beneficiaryName', defaultBeneficiaryName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultBeneficiaryName]);

  async function handlePickImage(source: 'camera' | 'gallery') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });

    if (!result.canceled && result.assets[0]) {
      await deleteAttachment(attachmentUri);
      const persistedUri = await persistAttachment(result.assets[0].uri);
      setValue('attachmentUri', persistedUri, { shouldValidate: true });
    }
  }

  function handleAttachmentPress() {
    Alert.alert(t('transactions.attachment'), undefined, [
      { text: '📷', onPress: () => handlePickImage('camera') },
      { text: '🖼️', onPress: () => handlePickImage('gallery') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }

  const submit = handleSubmit(onSubmit);

  return (
    <Box flex={1}>
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 8 }} style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        <Box marginBottom="s">
          <SegmentedToggle
            value={type}
            onChange={(value) => {
              setValue('type', value);
              setValue('categoryId', '');
              setValue('incomeTypeUi', null);
            }}
            selectedColor="expense"
            options={[
              { value: 'Expense', label: t('transactions.expense') },
              { value: 'Income', label: t('transactions.income') },
            ]}
          />
        </Box>

        {/* Amount + Date, side by side */}
        <Box flexDirection="row" style={{ gap: 10 }} marginBottom="s">
          <Box flex={1}>
            <Text variant="caption">{t('transactions.amount')}</Text>
            <Box backgroundColor="surfaceAlt" borderRadius="m" style={{ height: 48, justifyContent: 'center' }}>
              <TextInput
                keyboardType="decimal-pad"
                placeholder="0.00"
                defaultValue={amount ? String(amount) : ''}
                placeholderTextColor={theme.colors.textSecondary}
                style={{ fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary, textAlign: 'center' }}
                onChangeText={(text) => setValue('amount', Number(text.replace(/[^0-9.]/g, '')) || 0, { shouldValidate: true })}
              />
            </Box>
            {errors.amount ? (
              <Text variant="caption" color="danger">
                {errors.amount.message}
              </Text>
            ) : null}
          </Box>

          <Box flex={1}>
            <Text variant="caption">{t('transactions.date')}</Text>
            <Pressable onPress={() => setShowDatePicker(true)}>
              <Box
                backgroundColor="surfaceAlt"
                borderRadius="m"
                paddingHorizontal="s"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                style={{ height: 48 }}
              >
                <Text variant="body" numberOfLines={1} style={{ fontSize: 13 }}>
                  {formatDateForDisplay(date, calendar)}
                </Text>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
              </Box>
            </Pressable>
          </Box>
        </Box>
        <DatePickerModal
          visible={showDatePicker}
          isoDate={date}
          onClose={() => setShowDatePicker(false)}
          onSelect={(iso) => {
            setValue('date', iso, { shouldValidate: true });
            setShowDatePicker(false);
          }}
        />

        {!isCustody ? (
          <Box marginBottom="s">
            <Text variant="caption">{t('transactions.category')}</Text>
            <CategoryPicker type={type} categoryId={categoryId} onSelect={(id) => setValue('categoryId', id, { shouldValidate: true })} />
            {errors.categoryId ? (
              <Text variant="caption" color="danger">
                {errors.categoryId.message}
              </Text>
            ) : null}
          </Box>
        ) : null}

        {type === 'Income' ? (
          <Box marginBottom="s">
            <Text variant="caption">{t('transactions.incomeType')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {INCOME_TYPES.map((option) => (
                <Chip
                  key={option}
                  label={t(`transactions.incomeTypes.${option}`)}
                  selected={incomeTypeUi === option}
                  onPress={() => setValue('incomeTypeUi', option, { shouldValidate: true })}
                />
              ))}
            </ScrollView>
            {errors.incomeTypeUi ? (
              <Text variant="caption" color="danger">
                {errors.incomeTypeUi.message}
              </Text>
            ) : null}

            {incomeTypeUi === 'Salary' ? (
              <Box marginTop="xs">
                <CompactField label={t('transactions.employer')} onChangeText={(text) => setValue('employer', text)} />
              </Box>
            ) : null}

            {incomeTypeUi === 'CashReceipt' || incomeTypeUi === 'Custody' ? (
              <Box flexDirection="row" style={{ gap: 10 }} marginTop="xs">
                <CompactField label={t('custody.personName')} onChangeText={(text) => setValue('personName', text)} error={errors.personName?.message} />
                <CompactField label={t('custody.reason')} optional onChangeText={(text) => setValue('reason', text)} />
              </Box>
            ) : null}

            {incomeTypeUi === 'IncomingTransfer' ? (
              <Box marginTop="xs">
                <CompactField label={t('transactions.senderName')} onChangeText={(text) => setValue('senderName', text)} />
              </Box>
            ) : null}

            {incomeTypeUi === 'Other' ? (
              <Box marginTop="xs">
                <CompactField label={t('transactions.source')} onChangeText={(text) => setValue('source', text)} />
              </Box>
            ) : null}
          </Box>
        ) : null}

        {!isCustody ? (
          <Box marginBottom="s">
            <Text variant="caption">{t('transactions.account')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {(accounts ?? []).map((account) => (
                <Chip
                  key={account.id}
                  label={account.name}
                  selected={accountId === account.id}
                  onPress={() => setValue('accountId', account.id, { shouldValidate: true })}
                />
              ))}
            </ScrollView>
            {errors.accountId ? (
              <Text variant="caption" color="danger">
                {errors.accountId.message}
              </Text>
            ) : null}
          </Box>
        ) : null}

        <Box marginBottom="s">
          <Text variant="caption">
            {t('transactions.beneficiary')} ({t('common.optional')})
          </Text>
          <BeneficiaryPicker value={beneficiaryName} onSelect={(name) => setValue('beneficiaryName', name)} />
        </Box>

        {/* Notes (single line) + attachment thumbnail, side by side to save vertical space */}
        <Box flexDirection="row" style={{ gap: 10 }} alignItems="flex-end">
          <Box flex={1}>
            <Text variant="caption">
              {t('transactions.notes')} ({t('common.optional')})
            </Text>
            <Box backgroundColor="surfaceAlt" borderRadius="m" paddingHorizontal="s" style={{ height: 40, justifyContent: 'center' }}>
              <TextInput
                defaultValue={defaultValues.note ?? ''}
                onChangeText={(text) => setValue('note', text)}
                style={{ color: theme.colors.textPrimary, fontSize: 13 }}
              />
            </Box>
          </Box>

          <Pressable onPress={handleAttachmentPress}>
            {attachmentUri ? (
              <Box>
                <Image source={{ uri: attachmentUri }} style={{ width: 40, height: 40, borderRadius: 8 }} />
                <Pressable
                  onPress={async () => {
                    await deleteAttachment(attachmentUri);
                    setValue('attachmentUri', null);
                  }}
                  style={{ position: 'absolute', top: -6, end: -6 }}
                >
                  <Box backgroundColor="danger" borderRadius="round" width={16} height={16} alignItems="center" justifyContent="center">
                    <Ionicons name="close" size={11} color="white" />
                  </Box>
                </Pressable>
              </Box>
            ) : (
              <Box width={40} height={40} borderRadius="m" borderWidth={1} borderStyle="dashed" borderColor="border" alignItems="center" justifyContent="center">
                <Ionicons name="camera-outline" size={18} color={theme.colors.textSecondary} />
              </Box>
            )}
          </Pressable>
        </Box>
      </ScrollView>

      {/* Fixed footer so Save is always reachable without scrolling */}
      <Box padding="m" borderTopWidth={1} borderColor="border" backgroundColor="mainBackground">
        <PrimaryButton label={submitLabel} onPress={submit} loading={isSubmitting} />
      </Box>
    </Box>
  );
}
