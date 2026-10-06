import { NextResponse } from 'next/server';
import { sameOrigin, csrfValid, cookieName, cookieOptions, PRIVATE_HEADERS } from '@/lib/auth-core';
export function POST(request: Request) {
  if (!sameOrigin(request) || !csrfValid(request)) return NextResponse.json({ error: 'Обнови страницу и повтори выход.' }, { status: 403, headers: PRIVATE_HEADERS });
  const response = NextResponse.json({ ok: true }, { headers: { ...PRIVATE_HEADERS, 'Clear-Site-Data': '"cache"' } });
  response.cookies.set(cookieName('session'), '', cookieOptions(0));
  response.cookies.set(cookieName('csrf'), '', cookieOptions(0));
  return response;
}
