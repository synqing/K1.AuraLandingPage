/**
 * SpectraSynq / K1 Aura Design Tokens
 * Source of Truth for colors, fonts, and spacing.
 */

export const K1_THEME = {
  colors: {
    brand: {
      gold: '#FFB84D',
      goldDim: 'rgba(255, 184, 77, 0.3)',
      highlight: '#FFE5B4',
    },
    bg: {
      base: '#000000',
      surface: '#111111',
      overlay: '#1A1A1A',
    },
    text: {
      primary: '#F2F2F2',
      secondary: '#888888',
      muted: '#444444',
    },
    state: {
      error: '#FF4D4D',
      success: '#4DFFB8',
      info: '#4D88FF',
    },
  },
  fonts: {
    display: 'var(--font-space-grotesk)',
    body: 'var(--font-inter)',
    tech: 'var(--font-manrope)',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  animation: {
    fast: '200ms ease-in-out',
    medium: '400ms ease-in-out',
    slow: '700ms ease-in-out',
  },
} as const;
