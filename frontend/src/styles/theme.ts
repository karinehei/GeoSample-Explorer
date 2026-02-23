/**
 * Design tokens for consistent styling across the app.
 * Keeps the UI cohesive without a full design system.
 */
export const theme = {
  colors: {
    text: '#1a1a1a',
    textMuted: '#666',
    background: '#f8f9fa',
    surface: '#ffffff',
    border: '#dee2e6',
    borderLight: '#eee',
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    error: '#b91c1c',
    errorBg: '#fef2f2',
    focus: '#2563eb',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  radius: {
    sm: 4,
    md: 6,
  },
  font: {
    size: {
      xs: 12,
      sm: 13,
      base: 14,
      lg: 18,
      xl: 24,
    },
    weight: {
      normal: 400,
      medium: 500,
      semibold: 600,
    },
  },
} as const;
