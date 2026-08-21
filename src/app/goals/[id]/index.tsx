import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useDeactivateGoal, useGoal } from '@/features/goals/hooks';
import { formatAmount } from '@/lib/currency';

export default function GoalDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: goal } = useGoal(id);
  const deactivateGoal = useDeactivateGoal();

  function handleDelete() {
    Alert.alert(t('common.delete'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deactivateGoal.mutateAsync(id);
          router.back();
        },
      },
    ]);
  }

  if (!goal) {
    return <Box flex={1} backgroundColor="mainBackground" />;
  }

  const width = Math.min(100, Math.max(0, goal.pct));

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }} padding="l">
      <Text variant="header" marginBottom="l">
        {goal.name}
      </Text>

      <Box backgroundColor="surface" borderRadius="l" padding="l" marginBottom="l" style={{ gap: 10 }}>
        <Box flexDirection="row" justifyContent="space-between">
          <Text variant="caption">{t('goals.saved')}</Text>
          <Text variant="subtitle">{formatAmount(goal.savedAmount)}</Text>
        </Box>
        <Box flexDirection="row" justifyContent="space-between">
          <Text variant="caption">{t('goals.targetAmount')}</Text>
          <Text variant="body">{formatAmount(goal.targetAmount)}</Text>
        </Box>
        <Box height={10} borderRadius="s" backgroundColor="surfaceAlt" overflow="hidden">
          <Box height={10} borderRadius="s" backgroundColor="accent" style={{ width: `${width}%` }} />
        </Box>
        <Text variant="caption">{Math.round(goal.pct)}%</Text>
        {goal.targetDate ? (
          <Box flexDirection="row" justifyContent="space-between">
            <Text variant="caption">{t('goals.targetDate')}</Text>
            <Text variant="body">{goal.targetDate}</Text>
          </Box>
        ) : null}
        {goal.suggestedMonthlyAmount != null ? (
          <Text variant="caption" color="accent">
            {t('goals.suggestedMonthly', { amount: formatAmount(goal.suggestedMonthlyAmount) })}
          </Text>
        ) : null}
      </Box>

      <Pressable onPress={handleDelete}>
        <Box backgroundColor="dangerSurface" borderRadius="m" padding="m" alignItems="center">
          <Text variant="subtitle" color="danger">
            {t('common.delete')}
          </Text>
        </Box>
      </Pressable>
    </Box>
  );
}
