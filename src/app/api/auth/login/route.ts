import { NextResponse } from 'next/server';
import { authConfigured, sameOrigin, csrfValid, validCredentials, issueToken, requestHost, cookieName, cookieOptions, safeReturnTo, SESSION_TTL, PRIVATE_HEADERS } from '@/lib/auth-core';
import { admitLogin, readLoginBody } from '@/lib/login-security';
export async function POST(request: Request) {
  if (!authConfigured()) return NextResponse.json({ error: 'Вход владельца пока не настроен.' }, { status: 503, headers: PRIVATE_HEADERS });
  if (!sameOrigin(request) || !csrfValid(request)) return NextResponse.json({ error: 'Обнови страницу и повтори вход.' }, { status: 403, headers: PRIVATE_HEADERS });
  if (!admitLogin(request)) return NextResponse.json({ error: 'Слишком много попыток. Повтори через 15 минут.' }, { status: 429, headers: { ...PRIVATE_HEADERS, 'Retry-After': '900' } });
  let body;
  try { body = await readLoginBody(request); } catch { return NextResponse.json({ error: 'Проверь заполнение формы.' }, { status: 400, headers: PRIVATE_HEADERS }); }
  if (!validCredentials(body.username, body.password)) return NextResponse.json({ error: 'Неверный логин или пароль.' }, { status: 401, headers: PRIVATE_HEADERS });
  const response = NextResponse.json({ ok: true, returnTo: safeReturnTo(body.returnTo) }, { headers: PRIVATE_HEADERS });
  response.cookies.set(cookieName('session'), issueToken('session', requestHost(request.headers)), cookieOptions(SESSION_TTL));
  response.cookies.set(cookieName('csrf'), '', cookieOptions(0));
  return response;
}
