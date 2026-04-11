import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

export const lightColors = {
  bg: '#f0f4ff',
  card: '#ffffff',
  text: '#1a1a2e',
  subtext: '#777777',
  border: '#dde3f0',
  input: '#f0f4ff',
  header: '#ffffff',
  tabBar: '#ffffff',
  primary: '#4f46e5',
  muted: '#999999',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  dangerBorder: '#fca5a5',
  success: '#16a34a',
  warning: '#d97706',
  overlay: 'rgba(0,0,0,0.08)',
};

export const darkColors = {
  bg: '#0f0f1a',
  card: '#1e1e2e',
  text: '#e2e8f0',
  subtext: '#94a3b8',
  border: '#2d2d3f',
  input: '#1e1e2e',
  header: '#1e1e2e',
  tabBar: '#1e1e2e',
  primary: '#818cf8',
  muted: '#64748b',
  danger: '#f87171',
  dangerBg: '#450a0a',
  dangerBorder: '#7f1d1d',
  success: '#4ade80',
  warning: '#fbbf24',
  overlay: 'rgba(0,0,0,0.3)',
};

type Colors = typeof lightColors;

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  colors: Colors;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  colors: lightColors,
  isDark: false,
});

const THEME_KEY = '@panchyat_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  // Load saved theme on app start
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'dark' || saved === 'light') {
        setTheme(saved);
      }
    });
  }, []);

  const toggleTheme = async () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    await AsyncStorage.setItem(THEME_KEY, next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        colors: theme === 'light' ? lightColors : darkColors,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);