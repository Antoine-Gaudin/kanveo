// src/hooks/useTheme.js
import { useState, useEffect } from 'react';

const THEME_KEY = 'theme-preference';

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light'
};

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    // Vérifier la préférence sauvegardée
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
      return savedTheme;
    }

    // Sinon, vérifier la préférence du système
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return THEMES.LIGHT;
    }

    // Par défaut, mode sombre (comme actuellement)
    return THEMES.DARK;
  });

  useEffect(() => {
    // Appliquer le thème au document
    const root = document.documentElement;

    if (theme === THEMES.LIGHT) {
      root.classList.remove(THEMES.DARK);
      root.classList.add(THEMES.LIGHT);
    } else {
      root.classList.remove(THEMES.LIGHT);
      root.classList.add(THEMES.DARK);
    }

    // Sauvegarder la préférence
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
  };

  const setDarkMode = () => setTheme(THEMES.DARK);
  const setLightMode = () => setTheme(THEMES.LIGHT);

  return {
    theme,
    isDark: theme === THEMES.DARK,
    isLight: theme === THEMES.LIGHT,
    toggleTheme,
    setDarkMode,
    setLightMode
  };
}