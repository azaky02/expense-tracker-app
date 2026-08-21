import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';

import { Box } from '@/components/Box';
import { Chip } from '@/components/Chip';
import { Text } from '@/components/Text';
import { useCategoryMonthTotal, useExpenseCategoryBreakdown } from '@/features/transactions/hooks';
import { formatAmount } from '@/lib/currency';
import { getMonthRange } from '@/lib/dates';
import { useAppTheme } from '@/theme/ThemeProvider';

import { useCategoryTree, useCreateCategory } from '../hooks';
import { CategoryEditModal, type CategoryEditValues } from './CategoryEditModal';
import type { CategoryTreeNode } from '../types';

interface CategoryPickerProps {
  type: 'Expense' | 'Income';
  categoryId: string | null | undefined;
  onSelect: (categoryId: string) => void;
}

const NEW_CATEGORY_DEFAULTS: CategoryEditValues = { name: '', icon: '📌', color: '#D9B65C' };

export function CategoryPicker({ type, categoryId, onSelect }: CategoryPickerProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { data: tree } = useCategoryTree(type);
  const { start, end } = useMemo(() => getMonthRange(), []);
  const { data: expenseBreakdown } = useExpenseCategoryBreakdown(start, end);
  const createCategory = useCreateCategory();

  const [selectedMainId, setSelectedMainId] = useState<string | null>(null);
  const [addTarget, setAddTarget] = useState<{ parentCategoryId: string | null } | null>(null);

  const resolvedMainId =
    selectedMainId ?? tree?.find((c) => c.id === categoryId || c.children.some((child) => child.id === categoryId))?.id ?? null;
  const selectedMain: CategoryTreeNode | undefined = tree?.find((c) => c.id === resolvedMainId);

  const topFive = useMemo(() => {
    if (type !== 'Expense' || !expenseBreakdown) return [];
    return expenseBreakdown.slice(0, 5);
  }, [type, expenseBreakdown]);

  const { data: monthTotal } = useCategoryMonthTotal(categoryId ?? '', start, end, !!categoryId);

  function handleMainPress(main: CategoryTreeNode) {
    setSelectedMainId(main.id);
    if (main.children.length === 0) onSelect(main.id);
  }

  async function handleAddSave(values: CategoryEditValues) {
    if (!addTarget) return;
    const id = await createCategory.mutateAsync({ ...values, type, parentCategoryId: addTarget.parentCategoryId });
    if (addTarget.parentCategoryId) {
      setSelectedMainId(addTarget.parentCategoryId);
    } else {
      setSelectedMainId(id);
    }
    onSelect(id);
    setAddTarget(null);
  }

  return (
    <Box>
      {topFive.length > 0 ? (
        <Box marginBottom="m">
          <Text variant="caption" marginBottom="xs">
            {t('categories.topFive')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {topFive.map((item) => (
              <Chip
                key={item.categoryId}
                label={item.categoryName}
                selected={categoryId === item.categoryId}
                onPress={() => {
                  setSelectedMainId(item.categoryId);
                  onSelect(item.categoryId);
                }}
              />
            ))}
          </ScrollView>
        </Box>
      ) : null}

      <Box flexDirection="row" style={{ gap: 8 }}>
        {/* Main category column (right in RTL — first child) */}
        <Box flex={1} borderRadius="m" borderWidth={1} borderColor="border" padding="s">
          <Text variant="caption" textAlign="center" marginBottom="s">
            {t('categories.mainCategory')}
          </Text>
          <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled contentContainerStyle={{ gap: 6 }}>
            {(tree ?? []).map((main) => (
              <Pressable key={main.id} onPress={() => handleMainPress(main)}>
                <Box
                  borderRadius="s"
                  padding="s"
                  alignItems="center"
                  style={{ backgroundColor: resolvedMainId === main.id ? theme.colors.chipSelected : 'transparent' }}
                >
                  <Text
                    variant="body"
                    style={{ color: resolvedMainId === main.id ? theme.colors.chipSelectedText : theme.colors.textPrimary }}
                  >
                    {main.icon} {main.name}
                  </Text>
                </Box>
              </Pressable>
            ))}
            <Pressable onPress={() => setAddTarget({ parentCategoryId: null })}>
              <Text variant="caption" color="accent" textAlign="center" style={{ paddingVertical: 6 }}>
                + {t('categories.addNew')}
              </Text>
            </Pressable>
          </ScrollView>
        </Box>

        {/* Sub-category column (left in RTL — second child) */}
        <Box flex={1} borderRadius="m" borderWidth={1} borderColor="border" padding="s">
          <Text variant="caption" textAlign="center" marginBottom="s">
            {t('categories.subCategory')}
          </Text>
          <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled contentContainerStyle={{ gap: 6 }}>
            {(selectedMain?.children ?? []).map((child) => (
              <Pressable key={child.id} onPress={() => onSelect(child.id)}>
                <Box
                  borderRadius="s"
                  padding="s"
                  alignItems="center"
                  style={{ backgroundColor: categoryId === child.id ? theme.colors.chipSelected : 'transparent' }}
                >
                  <Text
                    variant="body"
                    style={{ color: categoryId === child.id ? theme.colors.chipSelectedText : theme.colors.textPrimary }}
                  >
                    {child.icon} {child.name}
                  </Text>
                </Box>
              </Pressable>
            ))}
            {selectedMain ? (
              <Pressable onPress={() => setAddTarget({ parentCategoryId: selectedMain.id })}>
                <Text variant="caption" color="accent" textAlign="center" style={{ paddingVertical: 6 }}>
                  + {t('categories.addNew')}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </Box>
      </Box>

      {categoryId && monthTotal != null ? (
        <Box marginTop="s" alignItems="center">
          <Text variant="caption" color="accent">
            {t('transactions.monthTotalForCategory', {
              category: selectedMain?.children.find((c) => c.id === categoryId)?.name ?? selectedMain?.name ?? '',
              amount: formatAmount(monthTotal),
            })}
          </Text>
        </Box>
      ) : null}

      {addTarget ? (
        <CategoryEditModal
          visible
          title={t('categories.addNew')}
          initialValues={NEW_CATEGORY_DEFAULTS}
          onClose={() => setAddTarget(null)}
          onSave={handleAddSave}
        />
      ) : null}
    </Box>
  );
}
