import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({ theme: 'light', toggleTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

// CSS переменные для светлой темы
const lightTheme = {
  '--primary-color': '#667eea',
  '--secondary-color': '#764ba2',
  '--background-color': '#f8fafc',
  '--surface-color': '#ffffff',
  '--text-primary': '#1e293b',
  '--text-secondary': '#64748b',
  '--text-muted': '#94a3b8',
  '--border-color': '#e2e8f0',
  '--border-light': '#f1f5f9',
  '--shadow-color': 'rgba(0, 0, 0, 0.1)',
  '--shadow-light': 'rgba(0, 0, 0, 0.05)',
  '--success-color': '#22c55e',
  '--warning-color': '#f59e0b',
  '--error-color': '#ef4444',
  '--info-color': '#3b82f6',
  '--card-background': 'rgba(255, 255, 255, 0.95)',
  '--gradient-primary': 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
  '--gradient-secondary': 'linear-gradient(135deg, rgba(240, 147, 251, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%)',
  '--gradient-tertiary': 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%)',
};

// CSS переменные для темной темы
const darkTheme = {
  '--primary-color': '#818cf8',
  '--secondary-color': '#a78bfa',
  '--background-color': '#0f172a',
  '--surface-color': '#1e293b',
  '--text-primary': '#f8fafc',
  '--text-secondary': '#cbd5e1',
  '--text-muted': '#94a3b8',
  '--border-color': '#334155',
  '--border-light': '#475569',
  '--shadow-color': 'rgba(0, 0, 0, 0.3)',
  '--shadow-light': 'rgba(0, 0, 0, 0.2)',
  '--success-color': '#4ade80',
  '--warning-color': '#fbbf24',
  '--error-color': '#f87171',
  '--info-color': '#60a5fa',
  '--card-background': 'rgba(30, 41, 59, 0.95)',
  '--gradient-primary': 'linear-gradient(135deg, rgba(129, 140, 248, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%)',
  '--gradient-secondary': 'linear-gradient(135deg, rgba(244, 114, 182, 0.15) 0%, rgba(251, 113, 133, 0.15) 100%)',
  '--gradient-tertiary': 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(34, 211, 238, 0.15) 100%)',
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    // Применяем CSS переменные в зависимости от темы
    const root = document.documentElement;
    const themeVars = theme === 'dark' ? darkTheme : lightTheme;
    
    Object.entries(themeVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Устанавливаем атрибут для Ant Design
    document.body.setAttribute('data-theme', theme);
    
    // Сохраняем в localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 