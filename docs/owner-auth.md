# Owner login and public project pages

## Scope

One deployment, one owner, one private vault. No public registration, Google identity login, MFA or email password reset is implemented. Google Calendar authorization remains a separate connector setup. Existing OS_USERNAME and OS_PASSWORD continue to work. A fresh browser is redirected from /os to /login with a validated internal returnTo path; APIs return JSON 401. An unconfigured deployment fails closed while public documents remain accessible.

## Cookies and request guards

A fixed-format HMAC-SHA256 token contains a random nonce, purpose, issued/expiry times and host audience, but no credentials or notes. Session life is 12 hours. Production cookies use __Host-, Secure, HttpOnly, SameSite=Lax and Path=/ without Domain. SameSite=Lax permits normal top-level navigation from the owner's main site; it is not the sole CSRF defense. Login and logout require a signed, short-lived double-submit CSRF token plus exact same-origin validation. Private mutation APIs independently verify the owner, Origin/Fetch Metadata and reject cross-origin writes. Public pages have no private connector calls. Proxy checks are duplicated at every private page, API and data-connector boundary. Private responses and login responses are no-store. Credential comparisons use fixed-size timing-safe hashes. Login bodies are bounded to 8 KiB; passwords are not logged or placed in browser storage.

OS_SESSION_SECRET is optional and recommended as an independent 32+ random-byte secret. Without it the current owner password derives the signing key for the existing single-owner deployment. The current username and password are mixed in even when a separate secret is set, so credential rotation invalidates tokens on deployments using the new values. Generate secrets locally or with a password manager, never commit them. Preview deployments do not receive production vault credentials by this change.

## Limits that must not be hidden

Sessions are stateless. Logout removes this browser's cookie, clears HTTP cache and informs same-origin tabs to re-check. A copied cookie is not centrally revoked and remains usable until its expiry unless owner credentials/key are rotated. For incident response rotate credentials/key, redeploy and protect/delete old deployments too. There is no per-session revocation database yet. Login throttling is per server instance (10 attempts per source within 15 minutes, bounded entries), not a distributed limiter. Before a public multi-user release, replace the owner gate with an established account/session provider, persistent revocation, MFA and shared rate limiting/WAF. Do not describe this as a full account platform.

OS_ALLOW_BASIC_AUTH=true preserves explicitly opted-in CLI clients. It is OFF by default because browser-cached Basic credentials undermine reliable logout. Do not enable it for ordinary browser use.

## Deployment and recovery

Existing production owner credentials are reused; no compulsory new setup. Changing the password or optional session key requires updating the relevant environment variables and a new deployment. This does not revoke provider tokens, which must be revoked separately. The production owner credentials must never be shared for a demo. Use synthetic fixtures instead.

## References checked during implementation

- https://nextjs.org/docs/app/guides/authentication
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
