import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(fs.readFileSync('src/lib/theme.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function browser({ stored = null, dark = false, blocked = false } = {}) {
  const storage = new Map(stored === null ? [] : [['theme', stored]]);
  const root = { dataset: {}, style: {}, classList: { toggle: (key, on) => { root.dark = on; } } };
  const media = new EventTarget(); media.matches = dark;
  const win = new EventTarget();
  win.localStorage = {
    getItem: key => { if (blocked) throw Error('blocked'); return storage.get(key) ?? null; },
    setItem: (key, value) => { if (blocked) throw Error('blocked'); storage.set(key, value); },
  };
  win.matchMedia = () => media;
  const meta = { content: '' };
  const document = { documentElement: root, querySelectorAll: () => [meta] };
  const sandboxModule = { exports: {} };
  const ctx = vm.createContext({ module: sandboxModule, exports: sandboxModule.exports, window: win, document, localStorage: win.localStorage, Event });
  vm.runInContext(compiled, ctx);
  const api = sandboxModule.exports;
  return { api, ctx, root, media, win, storage, meta };
}
for (const stored of [null, 'system', 'invalid', 'light', 'dark']) {
  for (const dark of [true, false]) {
    test(`initial theme: stored=${stored}, deviceDark=${dark}`, () => {
      const b = browser({stored, dark});
      const preference = stored === 'dark' || stored === 'light' ? stored : 'system';
      const resolved = preference === 'system' ? dark ? 'dark' : 'light' : preference;
      vm.runInContext(b.api.THEME_BOOTSTRAP, b.ctx);
      assert.equal(b.root.dataset.themePreference, preference);
      assert.equal(b.root.dataset.theme, resolved);
      assert.equal(b.api.readResolvedTheme(), resolved);
      assert.equal(b.root.style.colorScheme, resolved);
      assert.equal(b.storage.get('theme') ?? null, stored, 'bootstrap must not write a default preference');
    });
  }
}
test('blocked storage still follows system and supports manual choices in memory', () => {
  const b = browser({blocked: true, dark: true});
  vm.runInContext(b.api.THEME_BOOTSTRAP, b.ctx);
  assert.equal(b.root.dark, true);
  b.api.setThemePreference('light'); assert.equal(b.root.dark, false);
  b.api.setThemePreference('system'); assert.equal(b.root.dark, true);
});
test('live device changes apply in system mode; manual override wins', () => {
  const b = browser(); let changes = 0;
  const stop = b.api.subscribeTheme(() => { changes++; });
  b.media.matches = true; b.media.dispatchEvent(new Event('change'));
  assert.equal(b.root.dark, true);
  b.api.setThemePreference('light');
  b.media.dispatchEvent(new Event('change')); assert.equal(b.root.dark, false);
  b.api.setThemePreference('system'); assert.equal(b.root.dark, true);
  assert.equal(b.meta.content, '#161719');
  const before = changes; stop(); b.media.dispatchEvent(new Event('change')); assert.equal(changes, before);
});
test('storage updates from another tab synchronize; unrelated keys are ignored', () => {
  const b = browser(); let changes = 0;
  const stop = b.api.subscribeTheme(() => { changes++; });
  b.storage.set('theme', 'dark');
  const event = new Event('storage'); event.key = 'theme'; b.win.dispatchEvent(event);
  assert.equal(b.root.dark, true);
  const other = new Event('storage'); other.key = 'unrelated'; b.win.dispatchEvent(other);
  assert.equal(changes, 1);
  b.storage.clear(); const clear = new Event('storage'); clear.key = null; b.win.dispatchEvent(clear);
  assert.equal(b.api.readThemePreference(), 'system'); stop();
});
test('server imports are safe and default to system', () => {
  const sandboxModule = { exports: {} };
  vm.runInNewContext(compiled, { exports: sandboxModule.exports });
  assert.equal(sandboxModule.exports.readThemePreference(), 'system');
  assert.doesNotThrow(() => sandboxModule.exports.syncTheme());
});
