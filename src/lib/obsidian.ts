import 'server-only';

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

function repoParts() {
  const value = process.env.OBSIDIAN_REPO || DEFAULT_REPO;
  const [owner, repo] = value.split('/');
  if (!owner || !repo) throw new Error('OBSIDIAN_REPO must be in owner/repo format.');
  return { owner, repo };
}

function token() {
  return process.env.GITHUB_OBSIDIAN_TOKEN;
}

function headers(write = false): HeadersInit {
  const value = token();
  if (!value) {
    throw new Error(
      'Obsidian connector is not configured. Set GITHUB_OBSIDIAN_TOKEN on the server.',
    );
  }

  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${value}`,
    'X-GitHub-Api-Version': API_VERSION,
    ...(write ? { 'Content-Type': 'application/json' } : {}),
  };
}

function endpoint(path: string) {
  const { owner, repo } = repoParts();
  const encoded = path
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
  return `https://api.github.com/repos/${owner}/${repo}/contents/${encoded}`;
}

async function githubFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers: {
      ...headers(Boolean(init?.method && init.method !== 'GET')),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub vault request failed (${response.status}): ${detail}`);
  }

  return response;
}

export function isObsidianConfigured() {
  return Boolean(token());
}

export function vaultRepoName() {
  return process.env.OBSIDIAN_REPO || DEFAULT_REPO;
}

export async function getVaultFile(path: string): Promise<VaultFile> {
  const response = await githubFetch(endpoint(path));
  const data = await response.json();

  if (Array.isArray(data) || data.type !== 'file') {
    throw new Error(`Vault path is not a file: ${path}`);
  }

  return {
    path: data.path,
    name: data.name,
    sha: data.sha,
    content: Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8'),
    htmlUrl: data.html_url,
  };
}

export async function listVaultDirectory(path: string): Promise<VaultEntry[]> {
  const response = await githubFetch(endpoint(path));
  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(`Vault path is not a directory: ${path}`);
  }

  return data.map(item => ({
    name: item.name,
    path: item.path,
    sha: item.sha,
    type: item.type,
  }));
}

export async function createVaultFile(path: string, content: string, message: string) {
  const response = await githubFetch(endpoint(path), {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: Buffer.from(content, 'utf8').toString('base64'),
    }),
  });

  return response.json();
}

export async function updateVaultFile(
  path: string,
  content: string,
  sha: string,
  message: string,
) {
  const response = await githubFetch(endpoint(path), {
    method: 'PUT',
    body: JSON.stringify({
      message,
      sha,
      content: Buffer.from(content, 'utf8').toString('base64'),
    }),
  });

  return response.json();
}

function scalar(value: string): string | number | boolean | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map(item => item.trim())
      .filter(Boolean) as unknown as string;
  }
  return trimmed.replace(/^["']|["']$/g, '');
}

export function parseNote(content: string): ParsedNote {
  if (!content.startsWith('---\n')) {
    return { frontmatter: {}, body: content.trim() };
  }

  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: {}, body: content.trim() };

  const block = content.slice(4, end);
  const body = content.slice(end + 5).trim();
  const frontmatter: ParsedNote['frontmatter'] = {};
  let activeArrayKey: string | null = null;

  for (const line of block.split('\n')) {
    const arrayItem = line.match(/^\s+-\s+(.+)$/);
    if (arrayItem && activeArrayKey) {
      const current = frontmatter[activeArrayKey];
      const next = Array.isArray(current) ? current : [];
      next.push(arrayItem[1].trim());
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
    const parsed = scalar(raw);
    if (typeof parsed === 'string' && parsed.startsWith('[') && parsed.endsWith(']')) {
      frontmatter[key] = parsed
        .slice(1, -1)
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    } else {
      frontmatter[key] = parsed;
    }
  }

  return { frontmatter, body };
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
