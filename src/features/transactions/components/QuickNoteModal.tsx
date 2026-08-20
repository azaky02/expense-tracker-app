import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, TextInput } from 'react-native';

import { Box } from '@/components/Box';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/ThemeProvider';

interface QuickNoteModalProps {
  visible: boolean;
  initialNote: string;
  onClose: () => void;
  onSave: (note: string) => void;
}

export function QuickNoteModal({ visible, initialNote, onClose, onSave }: QuickNoteModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [note, setNote] = useState(initialNote);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Box flex={1} justifyContent="center" padding="l" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Box backgroundColor="surface" borderRadius="l" padding="l">
          <Text variant="subtitle" marginBottom="m">
            {t('transactions.quickNote')}
          </Text>
          <Box backgroundColor="surfaceAlt" borderRadius="m" padding="m" marginBottom="l">
            <TextInput
              multiline
              defaultValue={initialNote}
              onChangeText={setNote}
              style={{ minHeight: 60, color: theme.colors.textPrimary, textAlignVertical: 'top' }}
            />
          </Box>
          <Box flexDirection="row" style={{ gap: 12 }}>
            <Box flex={1}>
              <PrimaryButton label={t('common.cancel')} onPress={onClose} />
            </Box>
            <Box flex={1}>
              <PrimaryButton label={t('common.save')} onPress={() => onSave(note)} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
