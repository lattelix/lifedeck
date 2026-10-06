 'use client';
import { useEffect } from 'react';
export function SessionGuard() {
 useEffect(() => {
  const check = async () => { try { const response = await fetch('/api/auth/session', { cache: 'no-store' }); if (response.status === 401) window.location.replace('/login'); } catch { /* Network failure is not a logout. */ } };
  const visibility = () => { if (document.visibilityState === 'visible') void check(); };
  const storage = (event: StorageEvent) => { if (event.key === 'lifedeck-logout') void check(); };
  const show = (event: PageTransitionEvent) => { if (event.persisted) void check(); };
  document.addEventListener('visibilitychange', visibility); window.addEventListener('storage', storage); window.addEventListener('pageshow', show);
  return () => { document.removeEventListener('visibilitychange', visibility); window.removeEventListener('storage', storage); window.removeEventListener('pageshow', show); };
 }, []);
 return null;
}
