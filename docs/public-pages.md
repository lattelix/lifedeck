# LifeDeck public surface / Google Branding

## Routes

- https://os.lattelix.ru/ — public product landing (host-specific rewrite to /about, not a redirect to /os).
- /about — same public landing, explicit stable path.
- /privacy — privacy policy matching the current single-owner data flow.
- /terms — terms for the current personal release.
- /login — owner login, noindex/no-store.
- /os — private application. All private pages, APIs and connectors retain owner authorization.
- me.lattelix.ru/ — existing public activity profile is unchanged.

Google Branding values:
Application home page: https://os.lattelix.ru/
Application privacy policy link: https://os.lattelix.ru/privacy
Application terms of service link: https://os.lattelix.ru/terms
Authorized domain: lattelix.ru

Support/developer contact: lattelix.dev@gmail.com (the owner's existing contact selected for this project). No invented company, street address, compliance certificate or provider endorsement. The privacy policy describes Calendar scopes/data/use/storage/transfers/revocation, Git history and backups, cookies and platform logs. Private Calendar/vault data are not used for advertising or sent to LLMs by this version. The optional public-board pipeline is separate.

The content does not assert Google verification. Publishing these pages is not verification, domain-ownership proof or OAuth setup. Verify domain ownership in Search Console with an account associated with the Google Cloud project if requested. Calendar credentials and consent remain required. In particular, do not advertise public sign-up or an in-app OAuth connection button until implemented.

Legal content reflects current behavior but is not a jurisdiction-specific compliance opinion. Before public multi-user/commercial launch, the operator must review identity, actual hosting/log retention, legal bases and applicable rights, plus new integrations, and obtain legal review where needed. No arbitrary retention/deletion SLA is invented here.

## QA

pnpm lint && pnpm test && pnpm build && pnpm test:smoke && pnpm test:auth

Browser suites (all synthetic data):
npm install --prefix /tmp/lifedeck-browser playwright@1.63.0
node /tmp/lifedeck-browser/node_modules/playwright/cli.js install --with-deps chromium
PLAYWRIGHT_MODULE=/tmp/lifedeck-browser/node_modules/playwright pnpm test:public:browser
PLAYWRIGHT_MODULE=/tmp/lifedeck-browser/node_modules/playwright pnpm test:theme:browser

The new browser suite covers 320/390/768/1440 widths in both themes; public landing/legal/login routes, successful/failed owner login, safe returnTo, HttpOnly cookies, logout and other-tab session checks. HTTP tests include no-auth private routes, API denial, RSC bypass attempts, cookie integrity and origin/CSRF checks. Fixtures never access live vault/calendar data.

References:
https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
https://developers.google.com/terms/api-services-user-data-policy
