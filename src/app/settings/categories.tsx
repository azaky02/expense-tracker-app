import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { SegmentedToggle } from '@/components/SegmentedToggle';
import { Text } from '@/components/Text';
import { BudgetModal } from '@/features/budgets/components/BudgetModal';
import { CategoryEditModal, type CategoryEditValues } from '@/features/categories/components/CategoryEditModal';
import { useCategoryTree, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/features/categories/hooks';
import type { CategoryRecord } from '@/features/categories/types';
import { useAppTheme } from '@/theme/ThemeProvider';

type EditTarget =
  | { mode: 'create-main'; type: 'Expense' | 'Income' }
  | { mode: 'create-sub'; type: 'Expense' | 'Income'; parentCategoryId: string }
  | { mode: 'edit'; category: CategoryRecord };

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<'Expense' | 'Income'>('Expense');
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [budgetTarget, setBudgetTarget] = useState<CategoryRecord | null>(null);

  const { data: tree } = useCategoryTree(type);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  function handleDelete(category: CategoryRecord) {
    Alert.alert(t('common.delete'), category.name, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteCategory.mutate(category.id) },
    ]);
  }

  async function handleSave(values: CategoryEditValues) {
    if (!editTarget) return;
    if (editTarget.mode === 'create-main') {
      await createCategory.mutateAsync({ ...values, type: editTarget.type, parentCategoryId: null });
    } else if (editTarget.mode === 'create-sub') {
      await createCategory.mutateAsync({ ...values, type: editTarget.type, parentCategoryId: editTarget.parentCategoryId });
    } else {
      await updateCategory.mutateAsync({ id: editTarget.category.id, input: { ...values, type: editTarget.category.type } });
    }
    setEditTarget(null);
  }

  const initialValues: CategoryEditValues =
    editTarget?.mode === 'edit' ? editTarget.category : { name: '', icon: '📌', color: theme.colors.accent };

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <Box padding="l" paddingBottom="m" flexDirection="row" alignItems="center">
        <Pressable onPress={() => router.back()} style={{ marginEnd: 12 }}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <Text variant="title">{t('categories.manage')}</Text>
      </Box>

      <Box paddingHorizontal="l" marginBottom="m">
        <SegmentedToggle
          value={type}
          onChange={setType}
          options={[
            { value: 'Expense', label: t('transactions.expense') },
            { value: 'Income', label: t('transactions.income') },
          ]}
        />
      </Box>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
        {(tree ?? []).map((main) => (
          <Box key={main.id} marginBottom="m">
            <Box flexDirection="row" alignItems="center" backgroundColor="surfaceAlt" borderRadius="m" padding="m">
              <Box width={10} height={10} borderRadius="round" marginEnd="s" style={{ backgroundColor: main.color }} />
              <Text style={{ marginEnd: 8 }}>{main.icon}</Text>
              <Text variant="subtitle" flex={1}>
                {main.name}
              </Text>
              {type === 'Expense' ? (
                <Pressable onPress={() => setBudgetTarget(main)} style={{ marginEnd: 12 }}>
                  <Ionicons name="wallet-outline" size={18} color={theme.colors.textSecondary} />
                </Pressable>
              ) : null}
              {!main.isDefault ? (
                <>
                  <Pressable onPress={() => setEditTarget({ mode: 'edit', category: main })} style={{ marginEnd: 12 }}>
                    <Ionicons name="pencil" size={18} color={theme.colors.textSecondary} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(main)}>
                    <Ionicons name="trash" size={18} color={theme.colors.danger} />
                  </Pressable>
                </>
              ) : null}
            </Box>
            {main.children.map((child) => (
              <Box key={child.id} flexDirection="row" alignItems="center" padding="m" style={{ paddingStart: 32 }}>
                <Text style={{ marginEnd: 8 }}>{child.icon}</Text>
                <Text variant="body" flex={1}>
                  {child.name}
                </Text>
                {!child.isDefault ? (
                  <>
                    <Pressable onPress={() => setEditTarget({ mode: 'edit', category: child })} style={{ marginEnd: 12 }}>
                      <Ionicons name="pencil" size={16} color={theme.colors.textSecondary} />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(child)}>
                      <Ionicons name="trash" size={16} color={theme.colors.danger} />
                    </Pressable>
                  </>
                ) : null}
              </Box>
            ))}
            <Pressable onPress={() => setEditTarget({ mode: 'create-sub', type, parentCategoryId: main.id })}>
              <Text variant="caption" color="accent" style={{ paddingStart: 32, paddingTop: 4 }}>
                + {t('common.add')}
              </Text>
            </Pressable>
          </Box>
        ))}

        <Pressable onPress={() => setEditTarget({ mode: 'create-main', type })}>
          <Box borderRadius="m" borderWidth={1} borderStyle="dashed" borderColor="accent" padding="m" alignItems="center">
            <Text variant="subtitle" color="accent">
              + {t('categories.manage')}
            </Text>
          </Box>
        </Pressable>
      </ScrollView>

      {editTarget ? (
        <CategoryEditModal
          visible
          title={editTarget.mode === 'edit' ? t('common.edit') : t('common.add')}
          initialValues={initialValues}
          onClose={() => setEditTarget(null)}
          onSave={handleSave}
        />
      ) : null}

      {budgetTarget ? (
        <BudgetModal categoryId={budgetTarget.id} categoryName={budgetTarget.name} onClose={() => setBudgetTarget(null)} />
      ) : null}
    </Box>
  );
}
