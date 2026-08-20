// Deliberately not `as const`: theme.ts needs these typed as plain `string` (not hex-literal
// types) so light/dark variants of the same Theme type can hold different hex values.
export const palette = {
  navy900: '#0A1B2E',
  navy800: '#0F2A47',
  navy700: '#16395E',
  navy600: '#1E4A75',

  teal700: '#0B6E63',
  teal600: '#0E8C7F',
  teal500: '#12A897',
  teal100: '#DCF3EF',

  orange700: '#C9821C',
  orange600: '#F0A93B',
  orange100: '#FCEACB',

  red600: '#C4372E',
  red500: '#D64545',
  red100: '#FBE1DF',

  brown700: '#7A3B1E',
  brown600: '#93472A',

  white: '#FFFFFF',
  black: '#000000',

  grey50: '#F5F7F9',
  grey100: '#EDEFF2',
  grey200: '#E1E5EA',
  grey300: '#C9CFD6',
  grey400: '#9AA4B2',
  grey500: '#6B7683',
  grey600: '#4A535F',
  grey700: '#333A42',
  grey800: '#20252B',
  grey900: '#15181C',
};
