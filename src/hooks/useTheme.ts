'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  readResolvedTheme, readThemePreference, setThemePreference, subscribeTheme,
  type Theme, type ThemePreference,
} from '@/lib/theme';

const serverTheme = (): Theme => 'light';
const serverPreference = (): ThemePreference => 'system';

export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, readResolvedTheme, serverTheme);
  const preference = useSyncExternalStore(subscribeTheme, readThemePreference, serverPreference);
  const toggleTheme = useCallback(() => {
    setThemePreference(readResolvedTheme() === 'dark' ? 'light' : 'dark');
  }, []);
  return { theme, preference, setTheme: setThemePreference, toggleTheme };
}
