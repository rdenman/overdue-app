/**
 * Theme Context
 * Manages theme preference (light/dark) with AsyncStorage persistence.
 * Uses Appearance.setColorScheme() to sync native iOS components (UITabBar,
 * UINavigationBar, etc.) with the user's chosen theme.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const resolvedScheme: Theme = systemColorScheme === 'dark' ? 'dark' : 'light';
  const [theme, setTheme] = useState<Theme>(resolvedScheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load stored preference on mount and override native appearance to match.
  useEffect(() => {
    async function loadTheme() {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setTheme(storedTheme);
          Appearance.setColorScheme(storedTheme);
        }
        // No stored preference — follow system default (no override needed)
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    }

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    Appearance.setColorScheme(newTheme);

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Don't render children until theme is loaded to avoid flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
