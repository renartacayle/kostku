import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  isDark: false,
  isLight: true
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('kostku_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return 'light'; // Default KostKu is clean, comfortable light mode
    } catch (_) {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);
      localStorage.setItem('kostku_theme', theme);
      window.dispatchEvent(new CustomEvent('kostku_theme_changed', { detail: { theme } }));
    } catch (e) {
      console.warn('Error applying theme:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      setTheme,
      isDark: theme === 'dark',
      isLight: theme === 'light'
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
