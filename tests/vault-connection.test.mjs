import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = fs.readFileSync('src/lib/obsidian.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const repo = 'lattelix/obsidian';
const root = `https://api.github.com/repos/${repo}/contents/`;
const notePath = '10_System/Protocols/Universal Daily Protocol.md';
function load(mockFetch, env = {}) {
  const sandboxModule = { exports: {} };
  const context = vm.createContext({
    exports: sandboxModule.exports, module: sandboxModule, Buffer, URL, Response, AbortSignal,
    process: { env: { GITHUB_OBSIDIAN_TOKEN: 'fixture-token', OBSIDIAN_REPO: repo, ...env } },
    fetch: mockFetch,
    require: name => name === 'server-only' ? {} : require(name),
  });
  vm.runInContext(compiled, context);
  return sandboxModule.exports;
}
const fail = status => new Response(JSON.stringify({ message: 'secret-upstream-details' }), { status });
const file = () => Response.json({ type: 'file', path: notePath, name: 'Universal Daily Protocol.md', sha: 'a'.repeat(40), encoding: 'base64', content: Buffer.from('# Протокол\nТест').toString('base64') });

for (const [status, code] of [[401,'unauthorized'],[403,'forbidden'],[429,'rate_limited'],[500,'unavailable'],[502,'unavailable'],[409,'conflict'],[422,'conflict']]) {
  test(`GitHub ${status} becomes safe ${code}`, async () => {
    const vault = load(async () => fail(status));
    const result = await vault.readVault(() => vault.getVaultFile(notePath));
    assert.equal(result.ok, false);
    assert.equal(result.error.code, code);
    assert.ok(!JSON.stringify(result).includes('secret-upstream-details'));
  });
}
test('404 for inaccessible repository is NOT a missing Daily', async () => {
  const urls = [];
  const vault = load(async url => { urls.push(url); return fail(404); });
  const result = await vault.readVault(() => vault.getVaultFile(notePath));
  assert.equal(result.error.code, 'repository_unavailable');
  assert.deepEqual(urls, [root + '10_System/Protocols/Universal%20Daily%20Protocol.md', root]);
});
test('404 with readable root is a genuine missing path', async () => {
  const vault = load(async url => url === root ? Response.json([]) : fail(404));
  const result = await vault.readVault(() => vault.getVaultFile(notePath));
  assert.equal(result.error.code, 'not_found');
  assert.equal(result.error.status, 404);
});
test('successful Contents read confirms read access only', async () => {
  const vault = load(async () => Response.json([]));
  const result = await vault.checkVaultConnection();
  assert.equal(result.ok, true);
  assert.equal(result.data.readable, true);
  assert.equal(Object.hasOwn(result.data, 'writable'), false);
});
test('token absence makes no network request', async () => {
  const vault = load(() => { throw Error('network should not be called'); }, { GITHUB_OBSIDIAN_TOKEN: '' });
  assert.equal((await vault.checkVaultConnection()).error.code, 'not_configured');
});
test('trim config and token; encode Cyrillic and spaces', async () => {
  let seen;
  const vault = load(async (url, init) => { seen = { url, init }; return file(); }, { GITHUB_OBSIDIAN_TOKEN: ' fixture-token\n', OBSIDIAN_REPO: ` ${repo} ` });
  const result = await vault.getVaultFile('10_System/Тест заметки.md');
  assert.equal(result.content, '# Протокол\nТест');
  assert.ok(seen.url.endsWith(encodeURIComponent('Тест заметки.md')));
  assert.equal(seen.init.headers.Authorization, 'Bearer fixture-token');
  assert.equal(seen.init.cache, 'no-store');
  assert.ok(seen.init.signal);
});
for (const path of ['10_System/Protocols/../../secret.md','/absolute.md','10_System//x.md','10_System/%2e%2e/secret.md','10_System/\\secret.md']) {
  test(`reject unsafe path ${path}`, async () => {
    let calls = 0;
    const vault = load(async () => { calls++; return file(); });
    const result = await vault.readVault(() => vault.getVaultFile(path));
    assert.equal(result.error.code, 'invalid_path');
    assert.equal(calls, 0);
  });
}
test('invalid repository is rejected before fetch', async () => {
  const vault = load(() => { throw Error('no fetch'); }, { OBSIDIAN_REPO: 'https://github.com/lattelix/obsidian' });
  assert.equal((await vault.checkVaultConnection()).error.code, 'invalid_config');
});
test('rate-limit 403 is different from missing permission', async () => {
  const vault = load(async () => new Response('', { status: 403, headers: { 'x-ratelimit-remaining': '0' } }));
  assert.equal((await vault.checkVaultConnection()).error.code, 'rate_limited');
});
test('network and timeout errors are safe', async () => {
  const vault = load(async () => { throw Error('sensitive token in error'); });
  const result = await vault.checkVaultConnection();
  assert.equal(result.error.code, 'unavailable');
  assert.ok(!result.error.message.includes('sensitive token'));
});
test('malformed successful payload is rejected', async () => {
  const vault = load(async () => Response.json({ unexpected: true }));
  assert.equal((await vault.readVault(() => vault.getVaultFile(notePath))).error.code, 'unavailable');
});
test('empty directory remains a valid empty state', async () => {
  const vault = load(async () => Response.json([]));
  assert.equal((await vault.listVaultDirectory('10_System/Daily')).length, 0);
});
test('writes retain blob SHA precondition', async () => {
  let seen;
  const vault = load(async (_url, init) => { seen = JSON.parse(init.body); return Response.json({ content: { sha: 'b'.repeat(40) } }); });
  await vault.updateVaultFile(notePath, '# update', 'a'.repeat(40), 'test');
  assert.equal(seen.sha, 'a'.repeat(40));
  assert.equal(Buffer.from(seen.content, 'base64').toString(), '# update');
});
