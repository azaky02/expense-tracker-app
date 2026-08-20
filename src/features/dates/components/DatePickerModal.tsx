import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView } from 'react-native';

import { Box } from '@/components/Box';
import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Text } from '@/components/Text';
import {
  daysInMonth,
  gregorianPartsToIso,
  GREGORIAN_MONTH_NAMES_AR,
  hijriToIso,
  HIJRI_MONTH_NAMES,
  isoToGregorianParts,
  isoToHijri,
  type DateParts,
} from '@/lib/hijri';
import { useSettingsStore } from '@/state/useSettingsStore';

interface DatePickerModalProps {
  visible: boolean;
  isoDate: string;
  onClose: () => void;
  onSelect: (isoDate: string) => void;
}

export function DatePickerModal({ visible, isoDate, onClose, onSelect }: DatePickerModalProps) {
  const { t } = useTranslation();
  const calendar = useSettingsStore((s) => s.calendar);
  const monthNames = calendar === 'hijri' ? HIJRI_MONTH_NAMES : GREGORIAN_MONTH_NAMES_AR;
  const initial = calendar === 'hijri' ? isoToHijri(isoDate) : isoToGregorianParts(isoDate);

  const [parts, setParts] = useState<DateParts>(initial);

  const yearRange = Array.from({ length: 11 }, (_, i) => initial.year - 5 + i);
  const dayCount = daysInMonth(parts, calendar);
  const dayRange = Array.from({ length: dayCount }, (_, i) => i + 1);

  function handleConfirm() {
    const iso = calendar === 'hijri' ? hijriToIso(parts) : gregorianPartsToIso(parts);
    onSelect(iso);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Box flex={1} justifyContent="center" padding="l" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Box backgroundColor="surface" borderRadius="l" padding="l">
          <Text variant="subtitle" marginBottom="m">
            {t('transactions.date')}
          </Text>

          <Text variant="caption" marginBottom="xs">
            {t('dates.year')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
            {yearRange.map((year) => (
              <Chip key={year} label={String(year)} selected={parts.year === year} onPress={() => setParts((p) => ({ ...p, year }))} />
            ))}
          </ScrollView>

          <Text variant="caption" marginBottom="xs">
            {t('dates.month')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
            {monthNames.map((name, i) => (
              <Chip key={name} label={name} selected={parts.month === i + 1} onPress={() => setParts((p) => ({ ...p, month: i + 1, day: 1 }))} />
            ))}
          </ScrollView>

          <Text variant="caption" marginBottom="xs">
            {t('dates.day')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
            {dayRange.map((day) => (
              <Chip key={day} label={String(day)} selected={parts.day === day} onPress={() => setParts((p) => ({ ...p, day }))} />
            ))}
          </ScrollView>

          <Box flexDirection="row" style={{ gap: 12 }}>
            <Box flex={1}>
              <PrimaryButton label={t('common.cancel')} onPress={onClose} />
            </Box>
            <Box flex={1}>
              <PrimaryButton label={t('common.save')} onPress={handleConfirm} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
