import 'server-only';
import { requireOwnerData } from './owner-access';
import { cache } from 'react';

const DEFAULT_REPO = 'lattelix/obsidian';
const API_VERSION = '2022-11-28';

export interface VaultFile {
  path: string;
  name: string;
  sha: string;
  content: string;
  htmlUrl?: string;
}
export interface VaultEntry {
  name: string;
  path: string;
  sha: string;
  type: 'file' | 'dir';
}
export interface ParsedNote {
  frontmatter: Record<string, string | number | boolean | string[] | null>;
  body: string;
}
type FrontmatterValue = ParsedNote['frontmatter'][string];
export type VaultErrorCode = 'not_configured' | 'invalid_config' | 'unauthorized' | 'forbidden' | 'repository_unavailable' | 'not_found' | 'conflict' | 'rate_limited' | 'unavailable' | 'invalid_path';
export interface VaultProblem { code: VaultErrorCode; message: string; status: number }

const MESSAGES: Record<VaultErrorCode, string> = {
  not_configured: 'Добавь GITHUB_OBSIDIAN_TOKEN в Vercel для Production и выполни Redeploy.',
  invalid_config: 'Проверь OBSIDIAN_REPO: нужен owner/repository без URL и кавычек. Токен указывается отдельно в GITHUB_OBSIDIAN_TOKEN.',
  unauthorized: 'GitHub не принимает токен сайта. Проверь срок действия токена, обнови GITHUB_OBSIDIAN_TOKEN в Production и выполни Redeploy.',
  forbidden: 'GitHub запрещает доступ. В настройках токена проверь выбранный репозиторий obsidian и разрешение Contents: Read and write.',
  repository_unavailable: 'GitHub возвращает 404 для хранилища. Проверь OBSIDIAN_REPO и доступ токена именно к приватному obsidian (Contents: Read and write). Это не означает, что заметки удалены.',
  not_found: 'Хранилище доступно, но файл или папка по этому пути не найдены. Проверь путь и синхронизацию Obsidian с GitHub.',
  conflict: 'Заметка уже изменилась. Обнови страницу перед повторным сохранением; изменения в Obsidian не перезаписаны.',
  rate_limited: 'GitHub временно ограничил запросы. Подожди и повтори проверку подключения.',
  unavailable: 'Не удалось прочитать данные из GitHub. Попробуй ещё раз; сохранённые заметки не изменены.',
  invalid_path: 'Этот путь к заметке недопустим.',
};

export class VaultError extends Error {
  readonly code: VaultErrorCode;
  readonly status: number;
  constructor(code: VaultErrorCode, status = 503) {
    super(MESSAGES[code]);
    this.name = 'VaultError';
    this.code = code;
    this.status = status;
  }
}
export function vaultProblem(error: unknown): VaultProblem {
  if (error instanceof VaultError) return { code: error.code, message: error.message, status: error.status };
  // Never return upstream response bodies, request headers or credentials to clients.
  return { code: 'unavailable', message: MESSAGES.unavailable, status: 502 };
}
export async function readVault<T>(read: () => Promise<T>): Promise<
  { ok: true; data: T } | { ok: false; error: VaultProblem }
> {
  try { return { ok: true, data: await read() }; }
  catch (error) { return { ok: false, error: vaultProblem(error) }; }
}
export function vaultRepoName() {
  return process.env.OBSIDIAN_REPO?.trim() || DEFAULT_REPO;
}
function repoParts() {
  const value = vaultRepoName();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\/[a-zA-Z0-9_.-]+$/.test(value)) throw new VaultError('invalid_config');
  const [owner, repo] = value.split('/');
  return { owner, repo };
}
function token() { return process.env.GITHUB_OBSIDIAN_TOKEN?.trim(); }
export function isObsidianConfigured() { return Boolean(token()); }
function headers(write = false): Record<string, string> {
  const value = token();
  if (!value) throw new VaultError('not_configured');
  if (/\s|["']/.test(value)) throw new VaultError('invalid_config');
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${value}`,
    'X-GitHub-Api-Version': API_VERSION,
    ...(write ? { 'Content-Type': 'application/json' } : {}),
  };
}
export function assertVaultPath(path: string) {
  if (path !== '' && (/[\\%\u0000-\u001f\u007f]/.test(path) || path.split('/').some(part => !part || part === '.' || part === '..'))) {
    throw new VaultError('invalid_path', 400);
  }
}
function endpoint(path: string) {
  assertVaultPath(path);
  const { owner, repo } = repoParts();
  return `https://api.github.com/repos/${owner}/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
}
async function githubFetch(url: string, init?: RequestInit): Promise<Response> {
  await requireOwnerData();
  const requestHeaders = headers((init?.method || 'GET') !== 'GET');
  let response: Response;
  try {
    response = await fetch(url, {
      ...init, cache: 'no-store', redirect: 'error',
      signal: AbortSignal.timeout(10_000), headers: requestHeaders,
    });
  } catch { throw new VaultError('unavailable', 502); }
  if (response.ok) return response;
  if (response.status === 401) throw new VaultError('unauthorized');
  if (response.status === 429 || (response.status === 403 && (response.headers.get('x-ratelimit-remaining') === '0' || response.headers.has('retry-after')))) {
    throw new VaultError('rate_limited', 429);
  }
  if (response.status === 403) throw new VaultError('forbidden');
  if (response.status === 409 || response.status === 422) throw new VaultError('conflict', 409);
  if (response.status === 404) {
    if (url === endpoint('')) throw new VaultError('repository_unavailable');
    // GitHub masks inaccessible private repositories with 404. Check root Contents
    // using this same token before treating a missing path as an empty day.
    const access = await checkVaultConnection();
    if (!access.ok) throw new VaultError(access.error.code, access.error.status);
    throw new VaultError('not_found', 404);
  }
  throw new VaultError('unavailable', 502);
}
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export async function getVaultFile(path: string): Promise<VaultFile> {
  const response = await githubFetch(endpoint(path));
  const data: unknown = await response.json();
  if (!record(data) || data.type !== 'file' || data.encoding !== 'base64' || typeof data.content !== 'string' || typeof data.sha !== 'string' || typeof data.name !== 'string' || typeof data.path !== 'string') {
    throw new VaultError('unavailable', 502);
  }
  return {
    path: data.path, name: data.name, sha: data.sha,
    content: Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8'),
    htmlUrl: typeof data.html_url === 'string' ? data.html_url : undefined,
  };
}
export async function listVaultDirectory(path: string): Promise<VaultEntry[]> {
  const response = await githubFetch(endpoint(path));
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new VaultError('unavailable', 502);
  const entries: VaultEntry[] = [];
  for (const item of data) {
    if (!record(item) || (item.type !== 'file' && item.type !== 'dir')) continue;
    if (typeof item.name !== 'string' || typeof item.path !== 'string' || typeof item.sha !== 'string') throw new VaultError('unavailable', 502);
    entries.push({ name: item.name, path: item.path, sha: item.sha, type: item.type });
  }
  return entries;
}
// Request-scoped only: changing the token is reflected on the next request.
// Reading Contents verifies read access; write access is NOT claimed here.
export const checkVaultConnection = cache(async () => readVault(async () => {
  await listVaultDirectory('');
  return { readable: true as const };
}));
export async function createVaultFile(path: string, content: string, message: string) {
  const response = await githubFetch(endpoint(path), {
    method: 'PUT', body: JSON.stringify({ message, content: Buffer.from(content, 'utf8').toString('base64') }),
  });
  return response.json();
}
export async function updateVaultFile(path: string, content: string, sha: string, message: string) {
  const response = await githubFetch(endpoint(path), {
    method: 'PUT', body: JSON.stringify({ message, sha, content: Buffer.from(content, 'utf8').toString('base64') }),
  });
  return response.json();
}

function scalar(value: string): FrontmatterValue {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map(item => item.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }

  return trimmed.replace(/^["']|["']$/g, '');
}

export function parseNote(content: string): ParsedNote {
  const normalized = content.replace(/\r\n/g, '\n');

  if (!normalized.startsWith('---\n')) {
    return { frontmatter: {}, body: normalized.trim() };
  }

  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: {}, body: normalized.trim() };

  const block = normalized.slice(4, end);
  const body = normalized.slice(end + 5).trim();
  const frontmatter: ParsedNote['frontmatter'] = {};
  let activeArrayKey: string | null = null;

  for (const line of block.split('\n')) {
    const arrayItem = line.match(/^\s+-\s+(.+)$/);
    if (arrayItem && activeArrayKey) {
      const current = frontmatter[activeArrayKey];
      const next = Array.isArray(current) ? [...current] : [];
      next.push(arrayItem[1].trim().replace(/^["']|["']$/g, ''));
      frontmatter[activeArrayKey] = next;
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;

    const [, key, raw] = match;
    if (raw.trim() === '') {
      frontmatter[key] = [];
      activeArrayKey = key;
      continue;
    }

    activeArrayKey = null;
    frontmatter[key] = scalar(raw);
  }

  return { frontmatter, body };
}


function serializeFrontmatterScalar(
  value: string | number | boolean | null,
) {
  if (value === null || value === '') return '';
  if (typeof value === 'string') return JSON.stringify(value);
  return String(value);
}

export function patchFrontmatter(
  content: string,
  updates: Record<string, string | number | boolean | null>,
) {
  const normalized = content.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    throw new Error('Cannot patch note without YAML frontmatter.');
  }

  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) throw new Error('Cannot find the end of YAML frontmatter.');

  const lines = normalized.slice(4, end).split('\n');

  for (const [key, value] of Object.entries(updates)) {
    const replacement = `${key}: ${serializeFrontmatterScalar(value)}`;
    const index = lines.findIndex(line => line.startsWith(`${key}:`));

    if (index >= 0) {
      lines[index] = replacement;
    } else {
      lines.push(replacement);
    }
  }

  return `---\n${lines.join('\n')}\n---\n${normalized.slice(end + 5)}`;
}

export function todayInOsTimezone() {
  const timeZone = process.env.OS_TIME_ZONE || 'Europe/Moscow';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
