import type { Config } from 'tailwindcss';
import { K1_THEME } from './theme/tokens';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: K1_THEME.colors.brand.gold,
        'gold-dim': K1_THEME.colors.brand.goldDim,
        bg: K1_THEME.colors.bg.base,
        surface: K1_THEME.colors.bg.surface,
      },
      fontFamily: {
        inter: K1_THEME.fonts.body,
        manrope: K1_THEME.fonts.tech,
        space: K1_THEME.fonts.display,
      },
    },
  },
  plugins: [],
};

export default config;
