import { NextResponse, type NextRequest } from 'next/server';

const REALM = 'LifeDeck Personal OS';

function unauthorized(message = 'Authentication required.') {
  return new Response(message, {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Cache-Control': 'no-store',
    },
  });
}

export function proxy(request: NextRequest) {
  const username = process.env.OS_USERNAME;
  const password = process.env.OS_PASSWORD;

  if (!username || !password) {
    if (process.env.NODE_ENV !== 'production') return NextResponse.next();
    return new Response(
      'Personal OS is disabled until OS_USERNAME and OS_PASSWORD are configured.',
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Basic ')) return unauthorized();

  try {
    const decoded = atob(authorization.slice('Basic '.length));
    const separator = decoded.indexOf(':');
    if (separator === -1) return unauthorized();

    const suppliedUsername = decoded.slice(0, separator);
    const suppliedPassword = decoded.slice(separator + 1);

    if (suppliedUsername !== username || suppliedPassword !== password) {
      return unauthorized('Invalid credentials.');
    }
  } catch {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/os/:path*', '/api/os/:path*'],
};
