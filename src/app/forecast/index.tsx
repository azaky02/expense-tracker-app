import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/Box';
import { Text } from '@/components/Text';
import { useCashFlowForecast } from '@/features/forecast/hooks';
import { formatAmount } from '@/lib/currency';

export default function ForecastScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: forecast } = useCashFlowForecast();

  return (
    <Box flex={1} backgroundColor="mainBackground" style={{ paddingTop: insets.top }} padding="l">
      <Text variant="header" marginBottom="l">
        {t('forecast.title')}
      </Text>

      {forecast ? (
        <Box backgroundColor="surface" borderRadius="l" padding="l" style={{ gap: 12 }}>
          <Box flexDirection="row" justifyContent="space-between">
            <Text variant="caption">{t('forecast.currentBalance')}</Text>
            <Text variant="subtitle">{formatAmount(forecast.currentBalance)}</Text>
          </Box>
          <Box flexDirection="row" justifyContent="space-between">
            <Text variant="caption" color="income">
              {t('forecast.expectedIncome')}
            </Text>
            <Text variant="body" color="income">
              +{formatAmount(forecast.expectedIncome)}
            </Text>
          </Box>
          <Box flexDirection="row" justifyContent="space-between">
            <Text variant="caption" color="expense">
              {t('forecast.expectedPayments')}
            </Text>
            <Text variant="body" color="expense">
              -{formatAmount(forecast.expectedPayments)}
            </Text>
          </Box>
          <Box borderTopWidth={1} borderColor="border" paddingTop="m" flexDirection="row" justifyContent="space-between">
            <Text variant="subtitle">{t('forecast.forecastedBalance')}</Text>
            <Text variant="amountLarge">{formatAmount(forecast.forecastedBalance)}</Text>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
