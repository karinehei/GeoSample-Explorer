import type { CSSProperties } from 'react';
import { theme } from './theme';

const { colors, spacing, radius, font } = theme;

export const commonStyles = {
  input: {
    width: '100%',
    padding: `${spacing.sm}px ${spacing.md}px`,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    fontSize: font.size.base,
    fontFamily: 'inherit',
  } as CSSProperties,

  inputError: {
    borderColor: colors.error,
  } as CSSProperties,

  label: {
    display: 'block',
    marginBottom: spacing.xs,
    fontWeight: font.weight.medium,
    fontSize: font.size.sm,
    color: colors.text,
  } as CSSProperties,

  errorText: {
    fontSize: font.size.xs,
    color: colors.error,
    marginTop: spacing.xs,
  } as CSSProperties,

  button: {
    padding: `${spacing.sm}px ${spacing.lg}px`,
    fontSize: font.size.base,
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as CSSProperties,

  buttonPrimary: {
    background: colors.primary,
    color: '#fff',
    borderColor: colors.primary,
  } as CSSProperties,

  errorBanner: {
    padding: spacing.md,
    background: colors.errorBg,
    color: colors.error,
    borderRadius: radius.sm,
    fontSize: font.size.base,
  } as CSSProperties,
};
