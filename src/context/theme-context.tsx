import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, useColorScheme as useRNColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { getThemePreference, saveThemePreference, ThemePreference } from '@/services/storage';

export type { ThemePreference };
export type AppTheme = (typeof Colors)['light'] | (typeof Colors)['dark'];

export interface ThemeContextType {
  preference: ThemePreference;
  colorScheme: 'light' | 'dark';
  theme: AppTheme;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const defaultContextValue: ThemeContextType = {
  preference: 'system',
  colorScheme: 'light',
  theme: Colors.light,
  setThemePreference: async () => {},
  toggleTheme: async () => {},
};

export const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // Load saved preference on mount
  useEffect(() => {
    let mounted = true;
    async function loadPref() {
      try {
        const saved = await getThemePreference();
        if (mounted) {
          setPreferenceState(saved);
          if (saved !== 'system') {
            Appearance.setColorScheme(saved);
          } else {
            Appearance.setColorScheme('unspecified');
          }
        }
      } catch (e) {
        console.warn('Failed to load theme preference:', e);
      }
    }
    loadPref();
    return () => {
      mounted = false;
    };
  }, []);

  const resolvedScheme: 'light' | 'dark' =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const setThemePreference = async (newPref: ThemePreference) => {
    setPreferenceState(newPref);
    try {
      if (newPref === 'system') {
        Appearance.setColorScheme('unspecified');
      } else {
        Appearance.setColorScheme(newPref);
      }
      await saveThemePreference(newPref);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  };

  const toggleTheme = async () => {
    const next: ThemePreference = resolvedScheme === 'dark' ? 'light' : 'dark';
    await setThemePreference(next);
  };

  const value: ThemeContextType = {
    preference,
    colorScheme: resolvedScheme,
    theme: Colors[resolvedScheme],
    setThemePreference,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextType {
  return useContext(ThemeContext);
}
