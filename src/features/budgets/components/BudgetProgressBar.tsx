import React from 'react';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';

import { budgetBandColor, getBudgetStatus } from '../status';

export function BudgetProgressBar({ spent, limit }: { spent: number; limit: number }) {
  const { pct, band } = getBudgetStatus(spent, limit);
  const color = budgetBandColor(band);
  const width = Math.min(100, Math.max(0, pct));

  return (
    <Box>
      <Box height={8} borderRadius="s" backgroundColor="surfaceAlt" overflow="hidden">
        <Box height={8} borderRadius="s" backgroundColor={color} style={{ width: `${width}%` }} />
      </Box>
      <Text variant="caption" color={color} marginTop="xs">
        {Math.round(pct)}%
      </Text>
    </Box>
  );
}
