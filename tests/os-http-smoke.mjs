import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';

const dir = mkdtempSync(join(tmpdir(), 'lifedeck-smoke-'));
const modeFile = join(dir, 'mode');
writeFileSync(modeFile, 'repository-404');
const port = 3117;
const base = `http://127.0.0.1:${port}`;
const auth = { Origin: base, Authorization: `Basic ${Buffer.from('fixture:fixture-password').toString('base64')}` };
const server = spawn(process.execPath, ['--import', resolve('tests/fixtures/github-preload.mjs'), 'node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
  env: { ...process.env, NODE_ENV: 'production', OS_ALLOW_BASIC_AUTH: 'true', OS_USERNAME: 'fixture', OS_PASSWORD: 'fixture-password', GITHUB_OBSIDIAN_TOKEN: 'fixture-token', OBSIDIAN_REPO: 'lattelix/obsidian', OS_TIME_ZONE: 'Europe/Moscow', OS_TEST_MODE_FILE: modeFile, GOOGLE_CALENDAR_CLIENT_ID: '', GOOGLE_CALENDAR_CLIENT_SECRET: '', GOOGLE_CALENDAR_REFRESH_TOKEN: '' },
  stdio: ['ignore','pipe','pipe'],
});
let log = ''; server.stdout.on('data', b => { log += b; }); server.stderr.on('data', b => { log += b; });
let count = 0;
try {
  for (let i=0; i<60; i++) { try { await fetch(base); break; } catch { await new Promise(r => setTimeout(r, 250)); } }
  const unauth = await fetch(`${base}/os`);
  assert.equal(unauth.status, 401); count++;
  const publicPage = await fetch(base);
  assert.equal(publicPage.status, 200); count++;
  const routes = ['/os','/os/protocols','/os/review','/os/knowledge','/os/integrations','/os/capture','/os/calendar'];
  for (const mode of ['repository-404','unauthorized','upstream-error','missing-path','partial','ok']) {
    writeFileSync(modeFile, mode);
    for (const route of routes) {
      const res = await fetch(base+route, { headers: auth });
      const text = await res.text();
      assert.equal(res.status, 200, `${mode} ${route}`);
      assert.ok(!text.includes('This page couldn') && !text.includes('Application error'), `${mode} ${route}: crashed`);
      assert.ok(!text.includes('upstream-secret-sentinel'), 'upstream details leaked');
      if (route === '/os/integrations') {
        assert.ok(text.includes(['repository-404','unauthorized','upstream-error'].includes(mode) ? 'Ошибка доступа' : 'Чтение проверено'));
      }
      if (route === '/os' && ['repository-404','unauthorized','upstream-error'].includes(mode)) assert.ok(!text.includes('Create today note'), 'offered unsafe creation after failed read');
      if (route === '/os' && mode === 'missing-path') assert.ok(text.includes('Create today note'));
      count++;
    }
  }
  for (const mode of ['repository-404','unauthorized','upstream-error']) {
    writeFileSync(modeFile, mode);
    const res = await fetch(base+'/api/os/daily', { method: 'POST', headers: auth });
    const data = await res.json();
    assert.equal(res.status, mode === 'upstream-error' ? 502 : 503);
    assert.ok(data.code && data.error);
    assert.ok(!JSON.stringify(data).includes('upstream-secret-sentinel'));
    count++;
  }
  writeFileSync(modeFile, 'ok');
  const capture = await fetch(base+'/api/os/capture', { method:'POST', headers: { ...auth, 'Content-Type':'application/json' }, body: JSON.stringify({ text:'fixture capture' }) });
  assert.equal(capture.status, 200); count++;
  console.log(`PASS ${count} production HTTP scenarios (synthetic GitHub; no live vault writes)`);
} catch (error) { console.error(log.slice(-3500)); throw error; }
finally {
  if (server.exitCode === null) { server.kill('SIGTERM'); await new Promise(resolve => server.once('exit', resolve)); }
  rmSync(dir, { recursive:true, force:true });
}
