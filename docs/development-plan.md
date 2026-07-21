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
