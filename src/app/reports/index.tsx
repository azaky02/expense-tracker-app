import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, Pressable, ScrollView, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import {
  useBeneficiaryBreakdown,
  useExpenseByPaymentMethod,
  useExpenseCategoryBreakdown,
  useMonthOverMonthTotals,
} from '@/features/transactions/hooks';
import { formatAmount } from '@/lib/currency';
import { getMonthRange } from '@/lib/dates';
import { exportReportPdf } from '@/lib/pdf/exportReportPdf';
import { cashCardColor } from '@/theme/cardBrandColors';
import { useAppTheme, useChartPalette } from '@/theme/ThemeProvider';

export default function ReportsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const chartPalette = useChartPalette();
  const [monthOffset, setMonthOffset] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const categoryChartRef = useRef<View>(null);
  const paymentChartRef = useRef<View>(null);

  const reference = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1), [monthOffset]);
  const { start, end } = useMemo(() => getMonthRange(reference), [reference]);

  const { data: categoryBreakdown } = useExpenseCategoryBreakdown(start, end);
  const { data: paymentBreakdown } = useExpenseByPaymentMethod(start, end);
  const { data: monthOverMonth } = useMonthOverMonthTotals(6);
  const { data: beneficiaryBreakdown } = useBeneficiaryBreakdown(start, end);

  const categoryChartData = (categoryBreakdown ?? []).map((item, i) => ({
    value: item.total,
    color: item.categoryColor || chartPalette[i % chartPalette.length],
  }));

  const paymentChartData = (paymentBreakdown ?? []).map((item) => ({
    value: item.total,
    label: item.cardId ? item.label : t('common.cash'),
    frontColor: item.cardId ? item.color || theme.colors.accent : cashCardColor,
  }));

  const momChartData = (monthOverMonth ?? []).map((item) => ({
    value: item.expense,
    label: item.month.slice(5),
    frontColor: theme.colors.expense,
  }));

  async function handleExport() {
    setIsExporting(true);
    try {
      const categoryChartImage = categoryChartData.length > 0 && categoryChartRef.current
        ? await captureRef(categoryChartRef, { format: 'png', result: 'base64' })
        : null;
      const paymentChartImage = paymentChartData.length > 0 && paymentChartRef.current
        ? await captureRef(paymentChartRef, { format: 'png', result: 'base64' })
        : null;

      await exportReportPdf({
        isRtl: I18nManager.isRTL,
        monthLabel: start.slice(0, 7),
        categoryChartImage,
        paymentChartImage,
        categoryBreakdown: categoryBreakdown ?? [],
        monthOverMonth: monthOverMonth ?? [],
        beneficiaryBreakdown: beneficiaryBreakdown ?? [],
        labels: {
          title: t('dashboard.reports'),
          byCategory: t('dashboard.expenseByCategory'),
          byPaymentMethod: t('reports.byPaymentMethod'),
          monthOverMonth: t('reports.monthOverMonth'),
          byBeneficiary: t('reports.byBeneficiary'),
          total: t('common.egp'),
        },
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Box flexDirection="row" alignItems="center" marginBottom="l">
          <Pressable onPress={() => router.back()} style={{ marginEnd: 12 }}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
          </Pressable>
          <Text variant="title" flex={1}>
            {t('dashboard.reports')}
          </Text>
          <Pressable onPress={handleExport} disabled={isExporting}>
            <Ionicons name="share-outline" size={22} color={theme.colors.accent} />
          </Pressable>
        </Box>

        <Box flexDirection="row" alignItems="center" justifyContent="center" marginBottom="l" style={{ gap: 24 }}>
          <Pressable onPress={() => setMonthOffset((v) => v - 1)}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
          </Pressable>
          <Text variant="subtitle">{start.slice(0, 7)}</Text>
          <Pressable onPress={() => setMonthOffset((v) => Math.min(v + 1, 0))} disabled={monthOffset >= 0}>
            <Ionicons name="chevron-forward" size={22} color={monthOffset >= 0 ? theme.colors.border : theme.colors.textPrimary} />
          </Pressable>
        </Box>

        <Text variant="subtitle" marginBottom="m">
          {t('dashboard.expenseByCategory')}
        </Text>
        {categoryChartData.length > 0 ? (
          <View ref={categoryChartRef} collapsable={false}>
            <Box alignItems="center" marginBottom="l" backgroundColor="mainBackground">
              <PieChart data={categoryChartData} donut radius={80} innerRadius={50} />
            </Box>
          </View>
        ) : (
          <Text variant="caption" marginBottom="l">
            {t('common.comingSoon')}
          </Text>
        )}

        <Text variant="subtitle" marginBottom="m">
          {t('reports.byPaymentMethod')}
        </Text>
        {paymentChartData.length > 0 ? (
          <View ref={paymentChartRef} collapsable={false}>
            <Box marginBottom="l" backgroundColor="mainBackground">
              <BarChart data={paymentChartData} barWidth={32} spacing={24} roundedTop noOfSections={4} />
            </Box>
          </View>
        ) : null}

        <Text variant="subtitle" marginBottom="m">
          {t('reports.monthOverMonth')}
        </Text>
        {momChartData.length > 0 ? (
          <Box marginBottom="l">
            <BarChart data={momChartData} barWidth={24} spacing={16} roundedTop noOfSections={4} />
          </Box>
        ) : null}

        <Text variant="subtitle" marginBottom="m">
          {t('reports.byBeneficiary')}
        </Text>
        {(beneficiaryBreakdown ?? []).map((item) => (
          <Box
            key={item.beneficiaryName}
            flexDirection="row"
            justifyContent="space-between"
            backgroundColor="surfaceAlt"
            borderRadius="m"
            padding="m"
            marginBottom="s"
          >
            <Text variant="body">{item.beneficiaryName}</Text>
            <Text variant="subtitle">{formatAmount(item.total)}</Text>
          </Box>
        ))}
      </ScrollView>
    </Box>
  );
}
