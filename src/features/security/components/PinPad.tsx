import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable } from 'react-native';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/ThemeProvider';

const PIN_LENGTH = 4;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'];

interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
}

export function PinPad({ value, onChange }: PinPadProps) {
  const theme = useAppTheme();

  function handleKeyPress(key: string) {
    if (key === 'backspace') {
      onChange(value.slice(0, -1));
    } else if (key && value.length < PIN_LENGTH) {
      onChange(value + key);
    }
  }

  return (
    <Box alignItems="center">
      <Box flexDirection="row" style={{ gap: 16 }} marginBottom="xl">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <Box
            key={i}
            width={16}
            height={16}
            borderRadius="round"
            style={{ backgroundColor: i < value.length ? theme.colors.accent : theme.colors.chip }}
          />
        ))}
      </Box>
      <Box flexDirection="row" flexWrap="wrap" style={{ width: 240 }}>
        {KEYS.map((key, i) => (
          <Pressable key={i} onPress={() => handleKeyPress(key)} disabled={!key} style={{ width: 80, height: 64, alignItems: 'center', justifyContent: 'center' }}>
            {key === 'backspace' ? (
              <Ionicons name="backspace-outline" size={24} color={theme.colors.textPrimary} />
            ) : (
              <Text variant="title">{key}</Text>
            )}
          </Pressable>
        ))}
      </Box>
    </Box>
  );
}

export { PIN_LENGTH };
