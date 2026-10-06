 'use client';
import { useTheme } from '@/hooks/useTheme';
import { normalizeThemePreference } from '@/lib/theme';
export function PublicTheme() {
  const { preference, setTheme } = useTheme();
  return <label className="site-theme"><span className="sr-only">Цветовая тема</span><select aria-label="Цветовая тема" value={preference} onChange={e => setTheme(normalizeThemePreference(e.target.value))}><option value="system">Системная</option><option value="light">Светлая</option><option value="dark">Тёмная</option></select></label>;
}
