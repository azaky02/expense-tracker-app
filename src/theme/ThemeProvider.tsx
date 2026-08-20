import { ThemeProvider as RestyleThemeProvider, useTheme as useRestyleTheme } from '@shopify/restyle';
import React, { type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { useSettingsStore, type ThemeMode } from '@/state/useSettingsStore';

import { chartPalette, type ChartMode } from './chartPalette';
import { darkTheme, lightTheme, type Theme } from './theme';

function resolveScheme(themeMode: ThemeMode, systemScheme: string): ChartMode {
  if (themeMode !== 'system') return themeMode;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

function useResolvedScheme(): ChartMode {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const systemScheme = useColorScheme();
  return resolveScheme(themeMode, systemScheme ?? 'light');
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const resolvedScheme = useResolvedScheme();
  const theme = resolvedScheme === 'dark' ? darkTheme : lightTheme;

  return <RestyleThemeProvider theme={theme}>{children}</RestyleThemeProvider>;
}

export function useAppTheme() {
  return useRestyleTheme<Theme>();
}

export function useChartPalette() {
  const resolvedScheme = useResolvedScheme();
  return chartPalette[resolvedScheme];
}
