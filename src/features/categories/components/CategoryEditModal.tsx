import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, TextInput } from 'react-native';

import { Box } from '@/components/Box';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Text } from '@/components/Text';
import { chartPalette } from '@/theme/chartPalette';
import { useAppTheme } from '@/theme/ThemeProvider';

export interface CategoryEditValues {
  name: string;
  icon: string;
  color: string;
}

interface CategoryEditModalProps {
  visible: boolean;
  title: string;
  initialValues: CategoryEditValues;
  onClose: () => void;
  onSave: (values: CategoryEditValues) => void;
}

const swatches = [...chartPalette.light, ...chartPalette.dark.slice(0, 3)];

export function CategoryEditModal({ visible, title, initialValues, onClose, onSave }: CategoryEditModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [name, setName] = useState(initialValues.name);
  const [icon, setIcon] = useState(initialValues.icon);
  const [color, setColor] = useState(initialValues.color);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Box flex={1} justifyContent="center" padding="l" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Box backgroundColor="surface" borderRadius="l" padding="l">
          <Text variant="subtitle" marginBottom="m">
            {title}
          </Text>

          <Box flexDirection="row" style={{ gap: 8 }} marginBottom="m">
            <Box width={56} backgroundColor="surfaceAlt" borderRadius="m" padding="m" alignItems="center">
              <TextInput value={icon} onChangeText={setIcon} maxLength={2} style={{ fontSize: 20, textAlign: 'center' }} />
            </Box>
            <Box flex={1} backgroundColor="surfaceAlt" borderRadius="m" padding="m">
              <TextInput value={name} onChangeText={setName} placeholder={t('common.add')} placeholderTextColor={theme.colors.textSecondary} style={{ color: theme.colors.textPrimary }} />
            </Box>
          </Box>

          <Box flexDirection="row" style={{ gap: 8, flexWrap: 'wrap' }} marginBottom="l">
            {swatches.map((swatch) => (
              <Box
                key={swatch}
                onTouchEnd={() => setColor(swatch)}
                width={28}
                height={28}
                borderRadius="round"
                style={{
                  backgroundColor: swatch,
                  borderWidth: color === swatch ? 3 : 0,
                  borderColor: theme.colors.textPrimary,
                }}
              />
            ))}
          </Box>

          <Box flexDirection="row" style={{ gap: 12 }}>
            <Box flex={1}>
              <PrimaryButton label={t('common.cancel')} onPress={onClose} />
            </Box>
            <Box flex={1}>
              <PrimaryButton label={t('common.save')} onPress={() => onSave({ name, icon, color })} disabled={!name.trim()} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
