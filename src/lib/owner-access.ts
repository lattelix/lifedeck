import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authConfigured, ownerAuthorized, sameOrigin, PRIVATE_HEADERS } from './auth-core';

export async function requireOwnerPage() {
  if (!ownerAuthorized(await headers())) redirect('/login');
}
export async function requireOwnerData() {
  if (!ownerAuthorized(await headers())) throw new Error('Owner authentication required.');
}
export function guardMutation(request: Request): Response | null {
  if (!authConfigured()) return Response.json({ error: 'Вход владельца пока не настроен.' }, { status: 503, headers: PRIVATE_HEADERS });
  if (!ownerAuthorized(request.headers)) return Response.json({ error: 'Сессия завершилась. Войди снова; несохранённый текст пока оставь на странице.' }, { status: 401, headers: PRIVATE_HEADERS });
  if (!sameOrigin(request)) return Response.json({ error: 'Запрос должен исходить с этого сайта.' }, { status: 403, headers: PRIVATE_HEADERS });
  return null;
}
