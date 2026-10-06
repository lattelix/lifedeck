// Used only by the test runner. No real tokens or private vault data.
import fs from 'node:fs';
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  if (url.hostname !== 'api.github.com') return nativeFetch(input, init);
  const mode = fs.readFileSync(process.env.OS_TEST_MODE_FILE, 'utf8').trim();
  const path = decodeURIComponent(url.pathname.split('/contents/')[1] || '');
  const fixture = data => Response.json(data);
  const failure = status => new Response('{"message":"upstream-secret-sentinel"}', { status });
  if (mode === 'repository-404') return failure(404);
  if (mode === 'unauthorized') return failure(401);
  if (mode === 'upstream-error') return failure(500);
  if (init?.method === 'PUT') return fixture({ content: { sha: 'b'.repeat(40) }, commit: { sha: 'c'.repeat(40) } });
  if (!path) return fixture([{ type: 'dir', path: '10_System', name: '10_System', sha: 'a'.repeat(40) }]);
  if (mode === 'missing-path') return failure(404);
  if (path === '10_System/Daily') return fixture([{ type: 'file', path: '10_System/Daily/2026-10-02.md', name: '2026-10-02.md', sha: 'a'.repeat(40) }]);
  if (path === '20_PARA/Projects' || path === '20_PARA/Areas') return fixture([]);
  if (mode === 'partial' && path.endsWith('2026-10-02.md')) return failure(500);
  const daily = path.startsWith('10_System/Daily/');
  const content = daily ? '---\ntype: daily\nprotocol_mode: Reduced\ntop_1: Fixture priority\nenergy: 3\n---\n# Fixture Daily\nRead-only synthetic test note.' : '---\ntype: protocol\nstatus: active\n---\n# Fixture protocol\nNo private data.\n\n## Purpose\nTest rendering.';
  return fixture({ type: 'file', encoding: 'base64', sha: 'a'.repeat(40), path, name: path.split('/').at(-1), content: Buffer.from(content).toString('base64') });
};
