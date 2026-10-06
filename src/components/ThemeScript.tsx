import { THEME_BOOTSTRAP } from '@/lib/theme';

/** Must remain synchronous in <head>, ahead of the visible application. */
export function ThemeScript() {
  return <script id="lifedeck-theme" dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />;
}
