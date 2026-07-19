import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'ace_theme_preference';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  backgroundDeep: string;
  surface: string;
  surfaceSoft: string;
  text: string;
  muted: string;
  primary: string;
  primaryDeep: string;
  accent: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  cyan: string;
}

export const darkColors: ThemeColors = {
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

export const lightColors: ThemeColors = {
  background: '#84A1E6',
  backgroundDeep: '#84A1E6',
  surface: '#1F4EBA',
  surfaceSoft: '#F5F8FF',
  text: '#1A1A2E',
  muted: '#AFB5C2',
  primary: '#10244F',
  primaryDeep: '#2459D4',
  accent: '#6F5DFF',
  border: 'rgba(0, 0, 0, 0.1)',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  cyan: '#23B7FF',
};

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: darkColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setMode(stored);
      }
      setLoaded(true);
    });
  }, []);

  const toggleTheme = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
  };

  const colors = mode === 'dark' ? darkColors : lightColors;

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}