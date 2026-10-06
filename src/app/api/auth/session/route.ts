import { ownerAuthorized, PRIVATE_HEADERS } from '@/lib/auth-core';
export function GET(request: Request) { const authenticated = ownerAuthorized(request.headers); return Response.json({ authenticated }, { status: authenticated ? 200 : 401, headers: PRIVATE_HEADERS }); }
