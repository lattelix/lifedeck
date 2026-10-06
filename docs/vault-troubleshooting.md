# Private vault access troubleshooting

The web application's GITHUB_OBSIDIAN_TOKEN is independent of the ChatGPT GitHub connection.
A configured variable does not prove that the token can read the selected repository.

## GitHub returns 404

GitHub masks inaccessible private repositories as 404. Verify the token's Resource owner, selected repository (obsidian, not lifedeck), Contents read/write permission and expiration. OBSIDIAN_REPO must be owner/repository without a URL or quotes.

Editing the permissions of the same token normally only requires refreshing /os/integrations. If the token value changes, replace GITHUB_OBSIDIAN_TOKEN in the Vercel project's Production environment and redeploy. Never paste tokens into chat, notes or source code.

The connector probes root Contents after a path 404 using the same server token. Only a readable root plus path 404 is treated as a missing note. Daily creation never proceeds after an authorization or network failure.

## Health and errors

Integrations reports read access only after an actual root Contents request succeeds. This does not claim write permission; verify a user-initiated Capture separately. Missing Google credentials are independent and do not block vault features. Provider errors are mapped to safe actionable messages without upstream bodies or credentials. Review and Knowledge preserve partial results; unexpected errors retain OS navigation.

## Verification

pnpm test: 23 unit cases covering 401/403/404, rate limits, malformed payloads, config, UTF-8, traversal rejection, transport failures and SHA guards.
pnpm build && pnpm test:smoke: 48 production HTTP cases with synthetic GitHub responses, including failed/healthy/partial reads, authentication and public route preservation. No real private vault writes occur in these tests.
Manual browser automation in the repair sandbox: 28 route/viewport cases at 390px and 1280px with healthy/inaccessible synthetic data. Browser dependencies are not added to the production package.

Live verification still requires a working Production vault token. Do not treat a green build or mock test as proof that live credentials are configured correctly.

References:
- https://docs.github.com/en/rest/using-the-rest-api/troubleshooting-the-rest-api#404-not-found-for-an-existing-resource
- https://nextjs.org/docs/app/getting-started/error-handling
