import { createContext, useContext, useState } from 'react';
import React from 'react';

type Theme = 'light' | 'dark';

const lightColors = {
  bg: '#f0f4ff', card: '#fff', text: '#1a1a2e', subtext: '#777',
  border: '#dde3f0', input: '#f0f4ff', header: '#fff', tabBar: '#fff',
  primary: '#4f46e5', muted: '#999',
};

const darkColors = {
  bg: '#0f0f1a', card: '#1e1e2e', text: '#e2e8f0', subtext: '#94a3b8',
  border: '#2d2d3f', input: '#1e1e2e', header: '#1e1e2e', tabBar: '#1e1e2e',
  primary: '#818cf8', muted: '#64748b',
};

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  colors: typeof lightColors;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  colors: lightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors: theme === 'light' ? lightColors : darkColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);