'use client';

import { useId } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { normalizeThemePreference } from '@/lib/theme';

export function ThemeSwitcher() {
  const id = useId();
  const { preference, setTheme } = useTheme();
  return (
    <div className="os-theme-controls">
      <label htmlFor={id}>Тема</label>
      <div className="os-theme-select">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 21h8m-4-4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <select id={id} aria-label="Цветовая тема" value={preference}
          onChange={event => setTheme(normalizeThemePreference(event.target.value))}>
          <option value="system">Системная</option>
          <option value="light">Светлая</option>
          <option value="dark">Тёмная</option>
        </select>
      </div>
    </div>
  );
}
