// Run after pnpm build. PLAYWRIGHT_MODULE may point to an isolated Playwright install.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const dir = mkdtempSync(join(tmpdir(), 'lifedeck-theme-'));
const modeFile = join(dir, 'mode'); writeFileSync(modeFile, 'ok');
const base = 'http://127.0.0.1:3118';
const server = spawn(process.execPath, ['--import', resolve('tests/fixtures/theme-preload.mjs'), 'node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3118'], {
  env: { ...process.env, NODE_ENV: 'production', OS_ALLOW_BASIC_AUTH: 'true', OS_USERNAME: 'fixture', OS_PASSWORD: 'fixture-password', GITHUB_OBSIDIAN_TOKEN: 'fixture-token', OBSIDIAN_REPO: 'lattelix/obsidian', OS_TIME_ZONE: 'Europe/Moscow', OS_TEST_MODE_FILE: modeFile, GOOGLE_CALENDAR_CLIENT_ID: 'fixture', GOOGLE_CALENDAR_CLIENT_SECRET: 'fixture', GOOGLE_CALENDAR_REFRESH_TOKEN: 'fixture', GOOGLE_CALENDAR_IDS: 'Focus=primary' },
  stdio: 'ignore',
});
let browser;
let routesChecked = 0;
const errors = [];
try {
  let ready = false;
  for (let i = 0; i < 100; i++) { try { await fetch(base); ready = true; break; } catch { await new Promise(r => setTimeout(r, 200)); } }
  assert.ok(ready, 'production server ready');
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = options => browser.newContext({ httpCredentials: { username: 'fixture', password: 'fixture-password' }, ...options });
  const check = async (page, expected) => {
    await page.waitForFunction(t => document.documentElement.dataset.theme === t, expected);
    const s = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, preference: document.documentElement.dataset.themePreference, colorScheme: getComputedStyle(document.documentElement).colorScheme, width: innerWidth, scroll: document.documentElement.scrollWidth, colors: [...document.querySelectorAll('meta[name="theme-color"]')].map(m => m.content) }));
    assert.equal(s.theme, expected); assert.equal(s.colorScheme, expected);
    assert.ok(s.scroll <= s.width + 1, `horizontal overflow: ${s.scroll}/${s.width}`);
    assert.ok(s.colors.length > 0 && s.colors.every(c => c === (expected === 'dark' ? '#161719' : '#f4f5f7')));
  };
  for (const width of [390, 1280]) for (const colorScheme of ['light', 'dark']) {
    const ctx = await context({ viewport: { width, height: 900 }, colorScheme });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    for (const route of ['/os', '/os/protocols', '/os/capture', '/os/review', '/os/knowledge', '/os/integrations', '/os/calendar']) {
      await page.goto(base + route, { waitUntil: 'networkidle' });
      await check(page, colorScheme);
      assert.equal(await page.getByLabel('Цветовая тема').inputValue(), 'system');
      assert.equal(await page.evaluate(() => localStorage.getItem('theme')), null);
      assert.ok(!await page.getByText('This page couldn’t load').count());
      routesChecked++;
    }
    if (width === 1280 && colorScheme === 'dark' && process.env.THEME_SCREENSHOTS) {
      mkdirSync(process.env.THEME_SCREENSHOTS, { recursive: true });
      await page.goto(base + '/os/protocols', { waitUntil: 'networkidle' });
      await page.screenshot({ path: join(process.env.THEME_SCREENSHOTS, 'protocols-dark.png'), fullPage: true });
    }
    await ctx.close();
  }
  const ctx = await context({ viewport: { width: 390, height: 850 }, colorScheme: 'dark' });
  const page = await ctx.newPage(); await page.goto(base + '/os', { waitUntil: 'networkidle' });
  await check(page, 'dark');
  await page.emulateMedia({ colorScheme: 'light' }); await check(page, 'light');
  await page.getByLabel('Цветовая тема').selectOption('dark'); await check(page, 'dark');
  await page.reload({ waitUntil: 'networkidle' }); await check(page, 'dark');
  await page.getByRole('link', { name: 'Capture', exact: true }).click(); await check(page, 'dark');
  const tab = await ctx.newPage(); await tab.goto(base + '/os', { waitUntil: 'networkidle' });
  await tab.getByLabel('Цветовая тема').selectOption('light'); await check(page, 'light');
  await page.getByLabel('Цветовая тема').selectOption('system');
  await page.emulateMedia({ colorScheme: 'dark' }); await check(page, 'dark');
  for (const width of [320, 768]) { await page.setViewportSize({ width, height: 800 }); await check(page, 'dark'); }
  writeFileSync(modeFile, 'repository-404'); await page.goto(base + '/os/review', { waitUntil: 'networkidle' }); await check(page, 'dark');
  assert.ok(await page.locator('.os-warning').count()); writeFileSync(modeFile, 'ok');
  await ctx.close();
  // Bootstrap works before hydration: hold the JS bundles while checking the DOM.
  const boot = await context({ colorScheme: 'dark' });
  const bp = await boot.newPage();
  await bp.route('**/_next/static/**/*.js', route => route.abort());
  await bp.goto(base + '/os', { waitUntil: 'domcontentloaded' }); await check(bp, 'dark'); await boot.close();
  // Browser storage blocked: fallback to the device, and manual selection still works.
  const blocked = await context({ colorScheme: 'dark' });
  await blocked.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  const sp = await blocked.newPage(); await sp.goto(base + '/os', { waitUntil: 'networkidle' }); await check(sp, 'dark');
  await sp.getByLabel('Цветовая тема').selectOption('light'); await check(sp, 'light'); await blocked.close();
  // Legacy public-profile switch remains functional with the shared store.
  const pub = await context({ colorScheme: 'dark' }); const pp = await pub.newPage();
  await pp.goto(base, { waitUntil: 'networkidle' }); await check(pp, 'dark');
  await pp.locator('.theme-button').click(); await check(pp, 'light'); await pub.close();
  assert.deepEqual(errors, [], 'no hydration/browser errors');
  console.log(`PASS ${routesChecked} route/theme/viewport combinations + live system changes, overrides, reload, navigation, cross-tab, 320/768px, errors, pre-hydration, blocked storage, public profile`);
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
  rmSync(dir, { recursive: true, force: true });
}
