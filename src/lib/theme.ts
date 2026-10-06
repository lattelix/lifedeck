/** Browser preference only: never stored in the vault or sent to an API. */
export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';
export const THEME_KEY = 'theme'; // Preserve existing explicit light/dark choices.
const THEME_EVENT = 'lifedeck-theme-change';
let volatilePreference: ThemePreference | undefined;

export function normalizeThemePreference(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function readThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  if (volatilePreference) return volatilePreference;
  try { return normalizeThemePreference(window.localStorage.getItem(THEME_KEY)); }
  catch { return normalizeThemePreference(document.documentElement.dataset.themePreference); }
}

export function readSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  catch { return 'light'; }
}

export function readResolvedTheme(): Theme {
  const preference = readThemePreference();
  return preference === 'system' ? readSystemTheme() : preference;
}

export function syncTheme() {
  if (typeof document === 'undefined') return;
  const theme = readResolvedTheme();
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
  root.dataset.themePreference = readThemePreference();
  root.style.colorScheme = theme;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta => {
    meta.content = theme === 'dark' ? '#161719' : '#f4f5f7';
  });
}

export function setThemePreference(value: ThemePreference) {
  if (typeof window === 'undefined') return;
  const preference = normalizeThemePreference(value);
  volatilePreference = preference;
  try {
    window.localStorage.setItem(THEME_KEY, preference);
    volatilePreference = undefined;
  } catch { /* Blocked storage: keep the choice for this page session. */ }
  syncTheme();
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function subscribeTheme(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const update = () => { syncTheme(); onStoreChange(); };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_KEY && event.key !== null) return;
    volatilePreference = undefined;
    update();
  };
  let media: MediaQueryList | undefined;
  try { media = window.matchMedia('(prefers-color-scheme: dark)'); } catch { /* Safe fallback. */ }
  window.addEventListener('storage', onStorage);
  window.addEventListener(THEME_EVENT, update);
  media?.addEventListener('change', update);
  // Read the browser, not the SSR fallback: no light-theme flash on hydration.
  syncTheme();
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(THEME_EVENT, update);
    media?.removeEventListener('change', update);
  };
}

// Synchronous head bootstrap runs before any UI is painted or hydrated.
// localStorage failure must not prevent reading the operating system preference.
export const THEME_BOOTSTRAP = `(function(){
  var p='system',dark=false;
  try{var s=localStorage.getItem('theme');if(s==='light'||s==='dark')p=s;}catch(e){}
  try{dark=window.matchMedia('(prefers-color-scheme: dark)').matches;}catch(e){}
  var t=p==='system'?(dark?'dark':'light'):p,r=document.documentElement;
  r.classList.toggle('dark',t==='dark');r.dataset.theme=t;r.dataset.themePreference=p;r.style.colorScheme=t;
  document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.content=t==='dark'?'#161719':'#f4f5f7';});
})();`;
