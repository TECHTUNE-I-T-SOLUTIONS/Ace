import { useContext } from 'react';
import { ThemeContext } from './theme-context';

// Static colors for backward compatibility (non-reactive)
export const colors = {
  background: '#081629',
  backgroundDeep: '#050F1D',
  surface: '#12213B',
  surfaceSoft: '#182944',
  text: '#F5F8FF',
  muted: '#9CB0D0',
  primary: '#3D7CFF',
  primaryDeep: '#2459D4',
  accent: '#6F5DFF',
  border: 'rgba(148, 175, 230, 0.18)',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  cyan: '#23B7FF',
};

// Reactive hook that returns current theme colors
export function useColors() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return colors;
  return ctx.colors;
}

export const radii = {
  xl: 32,
  lg: 24,
  md: 18,
  sm: 14,
};