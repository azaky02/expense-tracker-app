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

export const lightTheme = createTheme({
  colors: {
    mainBackground: palette.grey50,
    surface: palette.white,
    surfaceAlt: palette.grey100,
    border: palette.grey200,

    textPrimary: palette.grey900,
    textSecondary: palette.grey500,
    textOnDark: palette.white,
    textOnDarkSecondary: palette.grey300,

    primary: palette.navy800,
    primaryAlt: palette.navy700,
    accent: palette.teal600,
    accentAlt: palette.teal700,
    warning: palette.orange600,
    warningSurface: palette.orange100,
    danger: palette.red500,
    dangerSurface: palette.red100,

    expense: palette.red600,
    income: palette.teal700,

    cash: palette.navy900,
    chip: palette.grey100,
    chipSelected: palette.teal600,
    chipSelectedText: palette.white,

    tabIconDefault: palette.grey400,
    tabIconSelected: palette.teal600,

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

export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    mainBackground: palette.grey900,
    surface: palette.grey800,
    surfaceAlt: palette.grey700,
    border: palette.grey700,

    textPrimary: palette.grey50,
    textSecondary: palette.grey400,
    textOnDark: palette.white,
    textOnDarkSecondary: palette.grey300,

    primary: palette.navy700,
    primaryAlt: palette.navy600,
    accent: palette.teal500,
    accentAlt: palette.teal600,
    warningSurface: palette.brown700,
    dangerSurface: palette.brown700,

    cash: palette.navy900,
    chip: palette.grey700,
    chipSelected: palette.teal600,
  },
};
