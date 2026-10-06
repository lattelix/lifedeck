# Personal OS themes

Default: System. A fresh browser follows prefers-color-scheme without writing an explicit theme to storage. Changing the device appearance updates the open app. Existing explicit light/dark preferences are preserved; select System to return to automatic behavior.

The OS sidebar contains Theme / System / Light / Dark (Russian UI labels). On mobile the selector is always visible in the top row above horizontally scrollable navigation. The chosen preference is stored locally in the existing `theme` key and synchronizes across tabs on the same origin. No credentials or vault changes are needed. When storage is blocked, system appearance still works and explicit overrides last for the current page session.

Implementation: `src/lib/theme.ts` owns normalization, resolution, browser events and the synchronous head bootstrap. `ThemeController` keeps the DOM in sync without applying an SSR light fallback during hydration. `useTheme` retains the public profile toggle contract. OS-scoped `theme.css` covers surfaces, text, forms, editor, warnings, focus, selection, controls and mobile navigation. Browser theme-color and native color-scheme follow the resolved appearance. The existing PWA manifest splash color is static; the app itself respects the chosen theme.

## Verification

`pnpm lint`, `pnpm test`, `pnpm build`, `pnpm test:smoke`.

Browser regression (synthetic GitHub and Calendar; no real private data):

```sh
npm install --prefix /tmp/lifedeck-browser playwright@1.63.0
node /tmp/lifedeck-browser/node_modules/playwright/cli.js install --with-deps chromium
PLAYWRIGHT_MODULE=/tmp/lifedeck-browser/node_modules/playwright pnpm test:theme:browser
```

The browser test starts and stops its own production Next.js instance on port 3118. Tests all seven OS routes in light/dark at 390px/1280px plus 320px/768px, live system changes, explicit override, reload, navigation, cross-tab changes, blocked storage, pre-hydration rendering, error states and the public profile. Set THEME_SCREENSHOTS to a local output directory for a synthetic-data screenshot. No test writes to the real vault or calendar.
