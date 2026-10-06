 'use client';
import { useState } from 'react';
import Link from 'next/link';
export function LoginForm({ returnTo, configured }: { returnTo: string; configured: boolean }) {
 const [busy, setBusy] = useState(false), [error, setError] = useState(''), [visible, setVisible] = useState(false);
 async function submit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (busy) return;
  const form = event.currentTarget, data = new FormData(form); setBusy(true); setError('');
  try {
   const csrf = await fetch('/api/auth/csrf', { cache: 'no-store' });
   const challenge = await csrf.json(); if (!csrf.ok) throw new Error(challenge.error || 'Не удалось начать вход.');
   const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': challenge.token }, body: JSON.stringify({ username: data.get('username'), password: data.get('password'), returnTo }) });
   const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Не удалось войти.');
   form.reset(); window.location.assign(result.returnTo);
  } catch (value) { setError(value instanceof Error ? value.message : 'Проверь соединение и повтори.'); setBusy(false); }
 }
 return <form method="post" action="/api/auth/login" onSubmit={submit} className="site-login-form" aria-busy={busy}>
  <noscript><p className="site-form-error">Для защищённого входа включи JavaScript.</p></noscript>
  {!configured && <div className="site-form-error" role="alert">Вход ещё не настроен владельцем развёртывания. Публичные страницы доступны; приватные данные закрыты.</div>}
  <label htmlFor="username">Логин<input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={256} disabled={!configured || busy} placeholder="Логин владельца" /></label>
  <div className="site-password-field"><label htmlFor="password">Пароль</label><span className="site-password"><input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required maxLength={1024} disabled={!configured || busy}/><button type="button" aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Скрыть' : 'Показать'}</button></span></div>
  {error && <p className="site-form-error" role="alert">{error}</p>}
  <button className="site-button" type="submit" disabled={!configured || busy}>{busy ? 'Входим…' : 'Войти в Personal OS'} <span aria-hidden="true">↗</span></button>
  <p className="site-caption">Вход владельца. Сессия действует до 12 часов.<br/>Google Calendar подключается отдельно, уже внутри настроенной системы.</p>
  <details><summary>Не получается войти?</summary><p>Используй свой логин и пароль LifeDeck — те же, что были у прежнего окна входа. Это не пароль от Google или GitHub. Восстановление доступа: владелец меняет OS_PASSWORD в настройках развёртывания и выполняет Redeploy. Автоматического сброса по почте пока нет.</p></details>
  <p className="site-caption">Подробнее: <Link href="/privacy">конфиденциальность</Link> и <Link href="/terms">условия использования</Link>.</p>
 </form>;
}
