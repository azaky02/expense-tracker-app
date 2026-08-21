import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useGoals } from '@/features/goals/hooks';
import type { GoalWithProgress } from '@/features/goals/types';
import { formatAmount } from '@/lib/currency';
import { useAppTheme } from '@/theme/ThemeProvider';

function GoalRow({ item, onPress }: { item: GoalWithProgress; onPress: () => void }) {
  const width = Math.min(100, Math.max(0, item.pct));
  return (
    <Pressable onPress={onPress}>
      <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
        <Text variant="subtitle">{item.name}</Text>
        <Text variant="caption" marginBottom="s">
          {formatAmount(item.savedAmount)} / {formatAmount(item.targetAmount)}
        </Text>
        <Box height={8} borderRadius="s" backgroundColor="surface" overflow="hidden">
          <Box height={8} borderRadius="s" backgroundColor="accent" style={{ width: `${width}%` }} />
        </Box>
      </Box>
    </Pressable>
  );
}

export default function GoalsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { data: goals } = useGoals();

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <FlatList
        data={goals ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => <GoalRow item={item} onPress={() => router.push(`/goals/${item.id}`)} />}
        ListHeaderComponent={
          <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="l">
            <Text variant="header">{t('goals.title')}</Text>
            <Pressable onPress={() => router.push('/goals/add')}>
              <Ionicons name="add-circle" size={28} color={theme.colors.accent} />
            </Pressable>
          </Box>
        }
      />
    </Box>
  );
}
