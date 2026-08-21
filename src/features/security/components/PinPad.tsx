import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable } from 'react-native';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';

const PIN_LENGTH = 4;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'];
const gold = '#D9B65C';

interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
}

export function PinPad({ value, onChange }: PinPadProps) {
  function handleKeyPress(key: string) {
    if (key === 'backspace') {
      onChange(value.slice(0, -1));
    } else if (key && value.length < PIN_LENGTH) {
      onChange(value + key);
    }
  }

  return (
    <Box alignItems="center">
      <Box flexDirection="row" style={{ gap: 12 }} marginBottom="l">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <Box
            key={i}
            width={52}
            height={52}
            borderRadius="m"
            alignItems="center"
            justifyContent="center"
            style={{ borderWidth: 1.5, borderColor: gold, backgroundColor: 'rgba(217,182,92,0.06)' }}
          >
            {i < value.length ? <Box width={10} height={10} borderRadius="round" style={{ backgroundColor: gold }} /> : null}
          </Box>
        ))}
      </Box>
      <Box flexDirection="row" flexWrap="wrap" style={{ width: 240 }}>
        {KEYS.map((key, i) => (
          <Pressable key={i} onPress={() => handleKeyPress(key)} disabled={!key} style={{ width: 80, height: 64, alignItems: 'center', justifyContent: 'center' }}>
            {key === 'backspace' ? (
              <Ionicons name="backspace-outline" size={22} color="#F5F1E6" />
            ) : (
              <Text style={{ color: '#F5F1E6', fontSize: 22, fontWeight: '700' }}>{key}</Text>
            )}
          </Pressable>
        ))}
      </Box>
    </Box>
  );
}

export { PIN_LENGTH };
