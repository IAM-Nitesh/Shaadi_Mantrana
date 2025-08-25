import { useEffect, useState, useCallback } from 'react';

type ColorScheme = 'light' | 'dark' | 'system';

interface UseDarkModeOptions {
  defaultScheme?: ColorScheme;
  storageKey?: string;
}

export function useDarkMode(options: UseDarkModeOptions = {}) {
  const { defaultScheme = 'system', storageKey = 'color-scheme' } = options;
  
  const [scheme, setScheme] = useState<ColorScheme>(defaultScheme);
  const [isDark, setIsDark] = useState(false);

  // Get system preference
  const getSystemPreference = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  // Get stored preference
  const getStoredPreference = useCallback(() => {
    if (typeof window === 'undefined') return defaultScheme;
    try {
      return (localStorage.getItem(storageKey) as ColorScheme) || defaultScheme;
    } catch {
      return defaultScheme;
    }
  }, [defaultScheme, storageKey]);

  // Set stored preference
  const setStoredPreference = useCallback((newScheme: ColorScheme) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(storageKey, newScheme);
    } catch {
      // Ignore storage errors
    }
  }, [storageKey]);

  // Update dark mode state
  const updateDarkMode = useCallback((newScheme: ColorScheme) => {
    setScheme(newScheme);
    setStoredPreference(newScheme);

    let shouldBeDark = false;
    
    switch (newScheme) {
      case 'dark':
        shouldBeDark = true;
        break;
      case 'light':
        shouldBeDark = false;
        break;
      case 'system':
        shouldBeDark = getSystemPreference();
        break;
    }

    setIsDark(shouldBeDark);
    
    // Update document class
    if (typeof document !== 'undefined') {
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [getSystemPreference, setStoredPreference]);

  // Initialize
  useEffect(() => {
    const storedScheme = getStoredPreference();
    updateDarkMode(storedScheme);
  }, [getStoredPreference, updateDarkMode]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (scheme === 'system') {
        updateDarkMode('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [scheme, updateDarkMode]);

  // Public methods
  const setColorScheme = useCallback((newScheme: ColorScheme) => {
    updateDarkMode(newScheme);
  }, [updateDarkMode]);

  const toggle = useCallback(() => {
    const newScheme = isDark ? 'light' : 'dark';
    updateDarkMode(newScheme);
  }, [isDark, updateDarkMode]);

  return {
    scheme,
    isDark,
    setColorScheme,
    toggle,
  };
} 