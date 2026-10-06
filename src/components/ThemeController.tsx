'use client';

import { useEffect } from 'react';
import { subscribeTheme } from '@/lib/theme';

/** Track device/theme changes even on pages with no visible theme control. */
export function ThemeController() {
  useEffect(() => subscribeTheme(() => {}), []);
  return null;
}
