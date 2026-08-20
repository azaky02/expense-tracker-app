import { palette } from './palette';

/** Ordered segment colors for category donut/bar charts. Distinct in both light and dark mode. */
export const chartPalette = {
  light: [
    palette.teal600,
    palette.orange600,
    palette.navy600,
    palette.red500,
    palette.grey400,
    palette.brown600,
    palette.teal500,
    palette.grey300,
  ],
  dark: [
    palette.teal500,
    palette.orange600,
    palette.navy600,
    palette.red500,
    palette.grey400,
    palette.brown600,
    palette.teal600,
    palette.grey500,
  ],
} as const;

export type ChartMode = keyof typeof chartPalette;
