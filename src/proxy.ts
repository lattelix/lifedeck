import { NextResponse, type NextRequest } from 'next/server';
import { ownerAuthorized, authConfigured, safeReturnTo, PRIVATE_HEADERS } from '@/lib/auth-core';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const host = (request.headers.get('host') || '').split(':')[0];
  if (path === '/' && host === (process.env.OS_HOST || 'os.lattelix.ru')) {
    return NextResponse.rewrite(new URL('/about', request.url));
  }
  const isPrivate = path === '/os' || path.startsWith('/os/') || path === '/api/os' || path.startsWith('/api/os/');
  if (!isPrivate) return NextResponse.next();
  if (!ownerAuthorized(request.headers)) {
    const api = path.startsWith('/api/');
    if (api || process.env.OS_ALLOW_BASIC_AUTH === 'true') {
      const response = NextResponse.json({ error: authConfigured() ? 'Требуется вход владельца.' : 'Вход владельца пока не настроен.' }, { status: authConfigured() ? 401 : 503, headers: PRIVATE_HEADERS });
      if (authConfigured() && process.env.OS_ALLOW_BASIC_AUTH === 'true') response.headers.set('WWW-Authenticate', 'Basic realm="LifeDeck Personal OS", charset="UTF-8"');
      return response;
    }
    const url = new URL('/login', request.url);
    url.searchParams.set('returnTo', safeReturnTo(path + request.nextUrl.search));
    const response = NextResponse.redirect(url);
    for (const [k,v] of Object.entries(PRIVATE_HEADERS)) response.headers.set(k,v);
    return response;
  }
  const response = NextResponse.next();
  for (const [k,v] of Object.entries(PRIVATE_HEADERS)) response.headers.set(k,v);
  return response;
}
export const config = { matcher: ['/', '/os/:path*', '/api/os/:path*'] };
