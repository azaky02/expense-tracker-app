import React from 'react';
import { ActivityIndicator, Pressable } from 'react-native';

import { Box } from './Box';
import { Text } from './Text';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function PrimaryButton({ label, onPress, disabled, loading }: PrimaryButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading}>
      <Box
        backgroundColor="accent"
        borderRadius="m"
        paddingVertical="m"
        alignItems="center"
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text variant="subtitle" color="textOnDark">{label}</Text>}
      </Box>
    </Pressable>
  );
}
