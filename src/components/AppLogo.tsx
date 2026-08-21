import React from 'react';
import { Image } from 'react-native';

import { Box } from '@/components/Box';

// Metro requires this file to exist at bundle time. assets/images/logo-mizan.png is the full
// lockup (icon + "MIZAN / ميزان" wordmark baked into the image, transparent background) — no
// separate on-screen text is drawn here, to avoid duplicating the name under the image.
const logoSource = require('../../assets/images/logo-mizan.png');

interface AppLogoProps {
  /** Width in px — height follows the source image's own aspect ratio via resizeMode="contain". */
  size?: number;
}

export function AppLogo({ size = 96 }: AppLogoProps) {
  return (
    <Box alignItems="center">
      <Image source={logoSource} style={{ width: size, height: size * 1.2 }} resizeMode="contain" />
    </Box>
  );
}
