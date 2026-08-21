import { createTheme } from '@shopify/restyle';

import { palette } from './palette';

const spacing = {
  none: 0,
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

const borderRadii = {
  none: 0,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  round: 999,
};

const textVariants = {
  defaults: {
    fontSize: 15,
    color: 'textPrimary',
  },
  header: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: 'textPrimary',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: 'textPrimary',
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: 'textPrimary',
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: 'textPrimary',
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: 'textSecondary',
  },
  amountLarge: {
    fontSize: 34,
    fontWeight: '800' as const,
    color: 'textOnDark',
  },
  amountNegative: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'expense',
  },
  amountPositive: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'income',
  },
};

/**
 * Single premium black/gold visual identity for the whole app — applied to both the light and
 * dark theme objects (see below) so the look is consistent regardless of system/user theme
 * setting, per the reference design the app is meant to match everywhere, not just the dashboard.
 */
export const lightTheme = createTheme({
  colors: {
    mainBackground: palette.onyx950,
    surface: palette.onyx900,
    surfaceAlt: palette.onyx850,
    border: palette.onyxBorder,

    textPrimary: palette.cream100,
    textSecondary: palette.cream300,
    textOnDark: palette.cream100,
    textOnDarkSecondary: palette.cream300,

    primary: palette.onyx900,
    primaryAlt: palette.onyx850,
    accent: palette.gold500,
    accentAlt: palette.gold600,
    warning: palette.gold500,
    warningSurface: palette.crimsonSurface,
    danger: palette.crimson500,
    dangerSurface: palette.crimsonSurface,

    expense: palette.crimson500,
    income: palette.emerald500,

    cash: palette.onyx900,
    chip: palette.onyx850,
    chipSelected: palette.gold500,
    chipSelectedText: palette.onyx950,

    tabIconDefault: palette.cream300,
    tabIconSelected: palette.gold500,

    transparent: 'transparent',
  },
  spacing,
  borderRadii,
  textVariants,
  cardVariants: {
    defaults: {
      backgroundColor: 'surface',
      borderRadius: 'l',
      padding: 'l',
    },
  },
  breakpoints: {},
});

export type Theme = typeof lightTheme;

export const darkTheme: Theme = lightTheme;
