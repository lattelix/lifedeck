import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// Single-owner authentication. No account registration or Google identity login.
export const SESSION_TTL = 12 * 60 * 60;
const CSRF_TTL = 15 * 60;
export function authConfigured() { return Boolean(process.env.OS_USERNAME && process.env.OS_PASSWORD); }
export function secureCookie() { return process.env.NODE_ENV === 'production'; }
export function cookieName(kind: 'session' | 'csrf') { return `${secureCookie() ? '__Host-' : ''}lifedeck-${kind}`; }
function key() {
  if (!authConfigured()) throw new Error('Owner access is not configured.');
  // Bind sessions to the current owner credentials: changing them invalidates all tokens.
  return createHmac('sha256', process.env.OS_SESSION_SECRET || process.env.OS_PASSWORD!)
    .update(JSON.stringify(['lifedeck-owner-v1', process.env.OS_USERNAME, process.env.OS_PASSWORD])).digest();
}
function equal(a: string, b: string) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}
export function validCredentials(username: unknown, password: unknown) {
  if (!authConfigured() || typeof username !== 'string' || typeof password !== 'string' || username.length > 256 || password.length > 1024) return false;
  const userMatches = equal(username, process.env.OS_USERNAME!);
  const passwordMatches = equal(password, process.env.OS_PASSWORD!);
  return userMatches && passwordMatches;
}
export function requestHost(h: Headers): string { return (h.get('host') || '').toLowerCase(); }
export function issueToken(kind: 'session' | 'csrf', host: string, now = Date.now()) {
  const issued = Math.floor(now / 1000);
  const payload = Buffer.from(JSON.stringify({ v: 1, kind, aud: host, iat: issued, exp: issued + (kind === 'session' ? SESSION_TTL : CSRF_TTL), nonce: randomBytes(24).toString('base64url') })).toString('base64url');
  return `${payload}.${createHmac('sha256', key()).update(payload).digest('base64url')}`;
}
export function verifyToken(token: string | undefined, kind: 'session' | 'csrf', host: string, now = Date.now()): boolean {
  if (!authConfigured() || !token || token.length > 2048 || !host) return false;
  const parts = token.split('.');
  if (parts.length !== 2 || parts.some(x => !/^[A-Za-z0-9_-]+$/.test(x))) return false;
  const [payload, signature] = parts;
  if (!equal(signature, createHmac('sha256', key()).update(payload).digest('base64url'))) return false;
  try {
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const current = Math.floor(now / 1000), ttl = kind === 'session' ? SESSION_TTL : CSRF_TTL;
    return p.v === 1 && p.kind === kind && p.aud === host && typeof p.nonce === 'string' && /^[A-Za-z0-9_-]{32}$/.test(p.nonce)
      && Number.isInteger(p.iat) && Number.isInteger(p.exp) && p.iat <= current + 30 && p.exp > current && p.exp - p.iat === ttl;
  } catch { return false; }
}
export function cookieValue(h: Headers, name: string): string | undefined {
  const matches = (h.get('cookie') || '').split(';').map(p => p.trim()).filter(p => p.startsWith(`${name}=`));
  return matches.length === 1 ? matches[0].slice(name.length + 1) : undefined;
}
export function ownerAuthorized(h: Headers) {
  if (verifyToken(cookieValue(h, cookieName('session')), 'session', requestHost(h))) return true;
  // Explicit opt-in for existing command-line clients and regression fixtures. Off by default.
  if (process.env.OS_ALLOW_BASIC_AUTH !== 'true') return false;
  const header = h.get('authorization') || '';
  if (!header.startsWith('Basic ') || header.length > 4096) return false;
  try {
    const text = Buffer.from(header.slice(6), 'base64').toString('utf8'), colon = text.indexOf(':');
    return colon > 0 && validCredentials(text.slice(0, colon), text.slice(colon + 1));
  } catch { return false; }
}
export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || value.length > 1000 || /[\\%\u0000-\u0020]/.test(value)) return '/os';
  try {
    const url = new URL(value, 'https://lifedeck.invalid');
    if (!value.startsWith('/') || url.origin !== 'https://lifedeck.invalid' || !(url.pathname === '/os' || url.pathname.startsWith('/os/'))) return '/os';
    return url.pathname + url.search + url.hash;
  } catch { return '/os'; }
}
export function sameOrigin(request: Request) {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return false;
  try {
    const origin = new URL(request.headers.get('origin') || '');
    const expected = new URL(request.url);
    return origin.host.toLowerCase() === requestHost(request.headers) && origin.protocol === expected.protocol;
  } catch { return false; }
}
export function csrfValid(request: Request) {
  const cookie = cookieValue(request.headers, cookieName('csrf'));
  const supplied = request.headers.get('x-csrf-token');
  return Boolean(cookie && supplied && equal(cookie, supplied) && verifyToken(cookie, 'csrf', requestHost(request.headers)));
}
export function cookieOptions(maxAge: number) { return { httpOnly: true, secure: secureCookie(), sameSite: 'lax' as const, path: '/', maxAge }; }
export const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' };
