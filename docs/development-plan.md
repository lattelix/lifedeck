# Development plan

## Phase 1: contest MVP

- Public profile overview with exact source-backed metrics.
- Interactive 26-week heatmap and keyboard-accessible day selection.
- Day details with category, source, item, and event title.
- Source overview with health, coverage, and public profile links.
- Dynamic Source -> Category -> Item privacy filters.
- Daily GitHub Actions refresh and Vercel redeploy.
- Contract validation, lint, production build, and responsive browser QA.

## Phase 2: private activity ingestion

- Google OAuth and encrypted refresh-token storage.
- Calendar allow/deny rules before publication.
- Deterministic classification first, optional LLM classification second.
- Review queue for low-confidence or sensitive events.
- Incremental ingestion with idempotency and per-connector observability.

## Phase 3: owned interaction modules

- Booking rules, slot calculation, email verification, and calendar writes.
- Permission-aware Obsidian indexing and the "Ask me" concierge.
- Scoped share links and embeddable widgets.
- Private owner dashboard for source health and publication review.

## Architecture direction

Keep the existing adapter boundary. Each connector owns authentication and
source-specific parsing, then returns the shared board contract. The aggregator
owns validation, deduplication, aggregation, and publication. The frontend only
consumes the contract and never contains source-specific parsing logic.

When OAuth and private data arrive, move generated activity from Git to a small
database with encrypted credentials and explicit publication state. Do not add
that infrastructure before the public MVP requires it.


## Personal OS implementation status

Implemented on `feat/personal-os`:

- protected `/os` workspace;
- Today state from Obsidian Daily notes;
- create missing Daily notes from the vault template;
- edit protocol mode, energy and Top 1;
- Universal Daily Protocol read/edit;
- Capture -> `00_Inbox`;
- Review from recent Daily notes;
- Knowledge view for selected vault context plus Projects/Areas index;
- server-side Obsidian read/write connector;
- Google Calendar server connector with 7-day timeline and event creation;
- PWA manifest and responsive private app shell;
- CI for lint + production build.

Still intentionally pending:

- interactive Google OAuth onboarding (current connector accepts server-side refresh-token credentials);
- automated Calendar Compiler / replan engine;
- voice transcription and AI routing;
- runtime database/cache for multi-user or realtime workloads;
- proper account authentication beyond the current single-user Basic Auth gate.
