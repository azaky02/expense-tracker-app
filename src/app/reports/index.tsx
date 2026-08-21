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
import { useOpenCustodyRecords } from '@/features/custody/hooks';
import { DatePickerModal } from '@/features/dates/components/DatePickerModal';
import { useGoals } from '@/features/goals/hooks';
import { useRecurringRules } from '@/features/recurring/hooks';
import {
  useBeneficiaryBreakdown,
  useExpenseByAccount,
  useExpenseCategoryBreakdown,
  useMonthOverMonthTotals,
} from '@/features/transactions/hooks';
import { formatAmount } from '@/lib/currency';
import { getMonthRange } from '@/lib/dates';
import { exportReportExcel } from '@/lib/excel/exportReportExcel';
import { formatDateForDisplay } from '@/lib/hijri';
import { exportReportPdf } from '@/lib/pdf/exportReportPdf';
import { useSettingsStore } from '@/state/useSettingsStore';
import { useAppTheme, useChartPalette } from '@/theme/ThemeProvider';

export default function ReportsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const chartPalette = useChartPalette();
  const calendar = useSettingsStore((s) => s.calendar);
  const [monthOffset, setMonthOffset] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const categoryChartRef = useRef<View>(null);
  const paymentChartRef = useRef<View>(null);

  const reference = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1), [monthOffset]);
  const { start, end } = useMemo(() => getMonthRange(reference), [reference]);

  // Independent of the month navigator above — lets the user export any custom date range.
  const [excelStart, setExcelStart] = useState(start);
  const [excelEnd, setExcelEnd] = useState(end);
  const [showExcelStartPicker, setShowExcelStartPicker] = useState(false);
  const [showExcelEndPicker, setShowExcelEndPicker] = useState(false);

  const { data: categoryBreakdown } = useExpenseCategoryBreakdown(start, end);
  const { data: accountBreakdown } = useExpenseByAccount(start, end);
  const { data: monthOverMonth } = useMonthOverMonthTotals(6);
  const { data: beneficiaryBreakdown } = useBeneficiaryBreakdown(start, end);
  const { data: goals } = useGoals();
  const { data: custodyRecords } = useOpenCustodyRecords();
  const { data: recurringRules } = useRecurringRules();

  const categoryChartData = (categoryBreakdown ?? []).map((item, i) => ({
    value: item.total,
    color: item.categoryColor || chartPalette[i % chartPalette.length],
  }));

  const paymentChartData = (accountBreakdown ?? []).map((item) => ({
    value: item.total,
    label: item.label,
    frontColor: item.color || theme.colors.accent,
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

  async function handleExportExcel() {
    setIsExportingExcel(true);
    try {
      await exportReportExcel({ start: excelStart, end: excelEnd });
    } finally {
      setIsExportingExcel(false);
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
          <Pressable onPress={handleExport} disabled={isExporting} style={{ marginEnd: 16 }}>
            <Ionicons name="share-outline" size={22} color={theme.colors.accent} />
          </Pressable>
          <Pressable onPress={handleExportExcel} disabled={isExportingExcel}>
            <Ionicons name="document-text-outline" size={22} color={theme.colors.accent} />
          </Pressable>
        </Box>

        <Box marginBottom="l">
          <Text variant="caption" marginBottom="xs">
            {t('reports.excelRange')}
          </Text>
          <Box flexDirection="row" style={{ gap: 8 }}>
            <Pressable style={{ flex: 1 }} onPress={() => setShowExcelStartPicker(true)}>
              <Box backgroundColor="surfaceAlt" borderRadius="m" padding="s" alignItems="center">
                <Text variant="caption">{formatDateForDisplay(excelStart, calendar)}</Text>
              </Box>
            </Pressable>
            <Pressable style={{ flex: 1 }} onPress={() => setShowExcelEndPicker(true)}>
              <Box backgroundColor="surfaceAlt" borderRadius="m" padding="s" alignItems="center">
                <Text variant="caption">{formatDateForDisplay(excelEnd, calendar)}</Text>
              </Box>
            </Pressable>
            <Pressable onPress={handleExportExcel} disabled={isExportingExcel}>
              <Box backgroundColor="accent" borderRadius="m" padding="s" paddingHorizontal="m" justifyContent="center">
                <Text variant="caption" color="textOnDark">
                  {t('reports.exportExcel')}
                </Text>
              </Box>
            </Pressable>
          </Box>
          <DatePickerModal visible={showExcelStartPicker} isoDate={excelStart} onClose={() => setShowExcelStartPicker(false)} onSelect={(iso) => { setExcelStart(iso); setShowExcelStartPicker(false); }} />
          <DatePickerModal visible={showExcelEndPicker} isoDate={excelEnd} onClose={() => setShowExcelEndPicker(false)} onSelect={(iso) => { setExcelEnd(iso); setShowExcelEndPicker(false); }} />
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

        <Text variant="subtitle" marginTop="l" marginBottom="m">
          {t('goals.title')}
        </Text>
        {(goals ?? []).length === 0 ? (
          <Text variant="caption" marginBottom="l">
            {t('common.comingSoon')}
          </Text>
        ) : (
          (goals ?? []).map((goal) => (
            <Box key={goal.id} backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
              <Box flexDirection="row" justifyContent="space-between">
                <Text variant="body">{goal.name}</Text>
                <Text variant="subtitle">{Math.round(goal.pct)}%</Text>
              </Box>
              <Text variant="caption">
                {formatAmount(goal.savedAmount)} / {formatAmount(goal.targetAmount)}
              </Text>
            </Box>
          ))
        )}

        <Text variant="subtitle" marginTop="l" marginBottom="m">
          {t('custody.title')}
        </Text>
        {(custodyRecords ?? []).length === 0 ? (
          <Text variant="caption" marginBottom="l">
            {t('common.comingSoon')}
          </Text>
        ) : (
          (custodyRecords ?? []).map((record) => (
            <Box key={record.id} flexDirection="row" justifyContent="space-between" backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
              <Text variant="body">{record.personName}</Text>
              <Text variant="subtitle">{formatAmount(record.remainingAmount)}</Text>
            </Box>
          ))
        )}

        <Text variant="subtitle" marginTop="l" marginBottom="m">
          {t('recurring.title')}
        </Text>
        {(recurringRules ?? []).length === 0 ? (
          <Text variant="caption">{t('common.comingSoon')}</Text>
        ) : (
          (recurringRules ?? []).map((rule) => (
            <Box key={rule.id} flexDirection="row" justifyContent="space-between" backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="s">
              <Text variant="body">{rule.name}</Text>
              <Text variant="subtitle">{formatAmount(rule.amount)}</Text>
            </Box>
          ))
        )}
      </ScrollView>
    </Box>
  );
}
