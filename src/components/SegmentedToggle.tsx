import React from 'react';
import { Pressable } from 'react-native';

import { Box } from './Box';
import { Text } from './Text';

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

interface SegmentedToggleProps<T extends string> {
  options: [Option<T>, Option<T>];
  value: T;
  onChange: (value: T) => void;
  /** Theme color for the selected segment's background — Expense/Income vs Cash/Card use different accents. */
  selectedColor?: keyof import('@/theme/theme').Theme['colors'];
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  selectedColor = 'accent',
}: SegmentedToggleProps<T>) {
  return (
    <Box flexDirection="row" style={{ gap: 12 }}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable key={option.value} style={{ flex: 1 }} onPress={() => onChange(option.value)}>
            <Box
              backgroundColor={isSelected ? selectedColor : 'chip'}
              borderRadius="m"
              paddingVertical="m"
              alignItems="center"
              flexDirection="row"
              justifyContent="center"
            >
              {option.icon ? (
                <Text marginEnd="xs" style={{ fontSize: 16 }}>
                  {option.icon}
                </Text>
              ) : null}
              <Text variant="subtitle" color={isSelected ? 'textOnDark' : 'textSecondary'}>
                {option.label}
              </Text>
            </Box>
          </Pressable>
        );
      })}
    </Box>
  );
}
