import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Switch, TextInput } from 'react-native';

import { Box } from '@/components/Box';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/ThemeProvider';

import { useCategoryBudget, useSetCategoryBudget } from '../hooks';

interface BudgetModalProps {
  categoryId: string;
  categoryName: string;
  onClose: () => void;
}

export function BudgetModal({ categoryId, categoryName, onClose }: BudgetModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { data: budget } = useCategoryBudget(categoryId);
  const setBudget = useSetCategoryBudget();

  const [isEnabled, setIsEnabled] = useState(budget?.isEnabled ?? false);
  const [limitText, setLimitText] = useState(budget?.monthlyLimit ? String(budget.monthlyLimit) : '');

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Box flex={1} justifyContent="center" padding="l" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Box backgroundColor="surface" borderRadius="l" padding="l">
          <Text variant="subtitle" marginBottom="m">
            {t('budgets.title', { category: categoryName })}
          </Text>

          <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="m">
            <Text variant="body">{t('budgets.enable')}</Text>
            <Switch value={isEnabled} onValueChange={setIsEnabled} />
          </Box>

          <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l">
            <TextInput
              value={limitText}
              onChangeText={setLimitText}
              keyboardType="decimal-pad"
              placeholder={t('budgets.monthlyLimit')}
              placeholderTextColor={theme.colors.textSecondary}
              style={{ color: theme.colors.textPrimary }}
            />
          </Box>

          <Box flexDirection="row" style={{ gap: 12 }}>
            <Box flex={1}>
              <PrimaryButton label={t('common.cancel')} onPress={onClose} />
            </Box>
            <Box flex={1}>
              <PrimaryButton
                label={t('common.save')}
                onPress={async () => {
                  await setBudget.mutateAsync({ categoryId, monthlyLimit: Number(limitText) || 0, isEnabled });
                  onClose();
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
