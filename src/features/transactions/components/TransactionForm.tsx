import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, ScrollView, TextInput } from 'react-native';

import { Box } from '@/components/Box';
import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SegmentedToggle } from '@/components/SegmentedToggle';
import { Text } from '@/components/Text';
import { useRecentBeneficiaries } from '@/features/beneficiaries/hooks';
import { useCards } from '@/features/cards/hooks';
import { useCategoryTree } from '@/features/categories/hooks';
import { DatePickerModal } from '@/features/dates/components/DatePickerModal';
import { deleteAttachment, persistAttachment } from '@/lib/attachments';
import { formatDateForDisplay } from '@/lib/hijri';
import { useSettingsStore } from '@/state/useSettingsStore';
import { useAppTheme } from '@/theme/ThemeProvider';

import { transactionFormSchema, type TransactionFormValues } from '../validators';

interface TransactionFormProps {
  defaultValues: TransactionFormValues;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
}

export function TransactionForm({ defaultValues, onSubmit, submitLabel, isSubmitting }: TransactionFormProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const calendar = useSettingsStore((s) => s.calendar);
  const [selectedMainId, setSelectedMainId] = useState<string | null>(null);
  const [showBeneficiarySuggestions, setShowBeneficiarySuggestions] = useState(false);
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
  const paymentMethodType = watch('paymentMethodType');
  const categoryId = watch('categoryId');
  const cardId = watch('cardId');
  const attachmentUri = watch('attachmentUri');
  const beneficiaryName = watch('beneficiaryName');
  const amount = watch('amount');
  const date = watch('date');

  const { data: categoryTree } = useCategoryTree(type);
  const { data: cards } = useCards();
  const { data: recentBeneficiaries } = useRecentBeneficiaries();

  const resolvedMainId =
    selectedMainId ?? categoryTree?.find((c) => c.id === categoryId || c.children.some((child) => child.id === categoryId))?.id ?? null;
  const selectedMain = categoryTree?.find((c) => c.id === resolvedMainId);

  function handleMainCategoryPress(mainId: string, hasChildren: boolean) {
    setSelectedMainId(mainId);
    if (!hasChildren) {
      setValue('categoryId', mainId, { shouldValidate: true });
    } else if (categoryTree) {
      const main = categoryTree.find((c) => c.id === mainId);
      const stillValid = main?.children.some((child) => child.id === categoryId);
      if (!stillValid) setValue('categoryId', '', { shouldValidate: true });
    }
  }

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
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Box marginBottom="l">
        <SegmentedToggle
          value={type}
          onChange={(value) => {
            setValue('type', value);
            setValue('categoryId', '');
            setSelectedMainId(null);
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
          placeholder="0.00"
          defaultValue={amount ? String(amount) : ''}
          placeholderTextColor={theme.colors.textSecondary}
          style={{ fontSize: 28, fontWeight: '800', color: theme.colors.textPrimary, textAlign: 'center' }}
          onChangeText={(text) => setValue('amount', Number(text.replace(/[^0-9.]/g, '')) || 0, { shouldValidate: true })}
        />
      </Box>
      {errors.amount ? (
        <Text variant="caption" color="danger" marginBottom="s">
          {errors.amount.message}
        </Text>
      ) : null}

      <Text variant="caption" marginBottom="xs">
        {t('transactions.date')}
      </Text>
      <Pressable onPress={() => setShowDatePicker(true)}>
        <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l" flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text variant="body">{formatDateForDisplay(date, calendar)}</Text>
          <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
        </Box>
      </Pressable>
      <DatePickerModal
        visible={showDatePicker}
        isoDate={date}
        onClose={() => setShowDatePicker(false)}
        onSelect={(iso) => {
          setValue('date', iso, { shouldValidate: true });
          setShowDatePicker(false);
        }}
      />

      <Text variant="caption" marginBottom="xs">
        {t('transactions.category')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {(categoryTree ?? []).map((main) => (
          <Chip
            key={main.id}
            icon={main.icon}
            label={main.name}
            selected={resolvedMainId === main.id}
            onPress={() => handleMainCategoryPress(main.id, main.children.length > 0)}
          />
        ))}
      </ScrollView>
      {selectedMain && selectedMain.children.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
          {selectedMain.children.map((child) => (
            <Chip
              key={child.id}
              icon={child.icon}
              label={child.name}
              selected={categoryId === child.id}
              onPress={() => setValue('categoryId', child.id, { shouldValidate: true })}
            />
          ))}
        </ScrollView>
      ) : null}
      {errors.categoryId ? (
        <Text variant="caption" color="danger" marginTop="s">
          {errors.categoryId.message}
        </Text>
      ) : null}

      <Box marginTop="l" marginBottom="l">
        <Text variant="caption" marginBottom="xs">
          {t('transactions.paymentMethod')}
        </Text>
        <SegmentedToggle
          value={paymentMethodType}
          onChange={(value) => {
            setValue('paymentMethodType', value);
            if (value === 'Cash') setValue('cardId', null);
          }}
          selectedColor="accent"
          options={[
            { value: 'Cash', label: t('common.cash'), icon: '💵' },
            { value: 'Card', label: t('common.card'), icon: '💳' },
          ]}
        />
        {paymentMethodType === 'Card' ? (
          <Box marginTop="s">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {(cards ?? []).map((card) => (
                <Chip
                  key={card.id}
                  label={`${card.nickname} •${card.last4Digits}`}
                  selected={cardId === card.id}
                  onPress={() => setValue('cardId', card.id, { shouldValidate: true })}
                />
              ))}
            </ScrollView>
            {errors.cardId ? (
              <Text variant="caption" color="danger" marginTop="s">
                {errors.cardId.message}
              </Text>
            ) : null}
          </Box>
        ) : null}
      </Box>

      <Text variant="caption" marginBottom="xs">
        {t('transactions.beneficiary')} ({t('common.optional')})
      </Text>
      <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s" flexDirection="row" alignItems="center">
        <TextInput
          value={beneficiaryName ?? ''}
          onChangeText={(text) => setValue('beneficiaryName', text)}
          onFocus={() => setShowBeneficiarySuggestions(true)}
          placeholder={t('transactions.beneficiaryPlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          style={{ flex: 1, color: theme.colors.textPrimary }}
        />
      </Box>
      {showBeneficiarySuggestions && (recentBeneficiaries ?? []).length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
          {(recentBeneficiaries ?? []).map((name) => (
            <Chip
              key={name}
              label={name}
              selected={false}
              onPress={() => {
                setValue('beneficiaryName', name);
                setShowBeneficiarySuggestions(false);
              }}
            />
          ))}
        </ScrollView>
      ) : (
        <Box marginBottom="l" />
      )}

      <Text variant="caption" marginBottom="xs">
        {t('transactions.notes')} ({t('common.optional')})
      </Text>
      <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l">
        <TextInput
          multiline
          numberOfLines={3}
          defaultValue={defaultValues.note ?? ''}
          onChangeText={(text) => setValue('note', text)}
          style={{ color: theme.colors.textPrimary, minHeight: 60, textAlignVertical: 'top' }}
        />
      </Box>

      <Text variant="caption" marginBottom="xs">
        {t('transactions.attachment')} ({t('common.optional')})
      </Text>
      <Pressable onPress={handleAttachmentPress}>
        {attachmentUri ? (
          <Box>
            <Image source={{ uri: attachmentUri }} style={{ width: 100, height: 100, borderRadius: 12 }} />
            <Pressable
              onPress={async () => {
                await deleteAttachment(attachmentUri);
                setValue('attachmentUri', null);
              }}
              style={{ position: 'absolute', top: -8, end: -8 }}
            >
              <Box backgroundColor="danger" borderRadius="round" width={24} height={24} alignItems="center" justifyContent="center">
                <Ionicons name="close" size={16} color="white" />
              </Box>
            </Pressable>
          </Box>
        ) : (
          <Box
            width={100}
            height={100}
            borderRadius="m"
            borderWidth={1}
            borderStyle="dashed"
            borderColor="border"
            alignItems="center"
            justifyContent="center"
            marginBottom="l"
          >
            <Ionicons name="camera-outline" size={28} color={theme.colors.textSecondary} />
          </Box>
        )}
      </Pressable>

      <Box marginTop="l">
        <PrimaryButton label={submitLabel} onPress={submit} loading={isSubmitting} />
      </Box>
    </ScrollView>
  );
}
