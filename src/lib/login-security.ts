import 'server-only';
import { createHash } from 'node:crypto';

// Per-instance defense, not a distributed rate limiter. See docs/owner-auth.md.
const attempts = new Map<string, { count: number; until: number }>();
export function admitLogin(request: Request, now = Date.now()): boolean {
  const ip = request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-real-ip') || 'local';
  const id = createHash('sha256').update(ip.slice(0, 256)).digest('hex');
  for (const [k, v] of attempts) if (v.until <= now) attempts.delete(k);
  const entry = attempts.get(id);
  if (entry && entry.count >= 10) return false;
  if (!entry && attempts.size >= 4096) return false;
  attempts.set(id, { count: (entry?.count || 0) + 1, until: entry?.until || now + 15 * 60 * 1000 });
  return true;
}
export async function readLoginBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('Expected JSON');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Empty body');
  let size = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > 8192) { await reader.cancel(); throw new Error('Body too large'); } chunks.push(value); }
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected object');
    return value as Record<string, unknown>;
  } finally { reader.releaseLock(); }
}
