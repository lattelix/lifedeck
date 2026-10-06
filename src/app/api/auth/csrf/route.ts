import { NextResponse } from 'next/server';
import { authConfigured, issueToken, requestHost, cookieName, cookieOptions, PRIVATE_HEADERS } from '@/lib/auth-core';
export function GET(request: Request) {
  if (!authConfigured()) return NextResponse.json({ error: 'Вход владельца пока не настроен.' }, { status: 503, headers: PRIVATE_HEADERS });
  if (['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site') || '')) return new Response(null, { status: 403, headers: PRIVATE_HEADERS });
  const token = issueToken('csrf', requestHost(request.headers));
  const response = NextResponse.json({ token }, { headers: PRIVATE_HEADERS });
  response.cookies.set(cookieName('csrf'), token, cookieOptions(900));
  return response;
}
