import React from 'react';
import { Pressable } from 'react-native';

import { Box } from './Box';
import { Text } from './Text';

interface ChipProps {
  label: string;
  icon?: string;
  selected: boolean;
  onPress: () => void;
}

export function Chip({ label, icon, selected, onPress }: ChipProps) {
  return (
    <Pressable onPress={onPress}>
      <Box
        backgroundColor={selected ? 'chipSelected' : 'chip'}
        borderRadius="round"
        paddingHorizontal="l"
        paddingVertical="s"
        flexDirection="row"
        alignItems="center"
      >
        {icon ? (
          <Text marginEnd="xs" style={{ fontSize: 16 }}>
            {icon}
          </Text>
        ) : null}
        <Text variant="body" fontWeight="600" color={selected ? 'chipSelectedText' : 'textPrimary'}>
          {label}
        </Text>
      </Box>
    </Pressable>
  );
}
