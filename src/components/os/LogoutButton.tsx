 'use client';
import { useState } from 'react';
export function LogoutButton() {
 const [busy, setBusy] = useState(false), [error, setError] = useState('');
 async function logout() {
  setBusy(true); setError('');
  try {
   const res = await fetch('/api/auth/csrf', { cache: 'no-store' }); const { token } = await res.json(); if (!res.ok) throw new Error();
   const out = await fetch('/api/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': token } }); if (!out.ok) throw new Error();
   try { localStorage.setItem('lifedeck-logout', String(Date.now())); } catch { /* Storage may be blocked. */ }
   window.location.replace('/login?loggedOut=1');
  } catch { setError('Не удалось выйти. Повтори.'); setBusy(false); }
 }
 return <div className="os-logout"><button type="button" onClick={logout} disabled={busy}>{busy ? 'Выходим…' : 'Выйти'}</button>{error && <span role="alert">{error}</span>}</div>;
}
