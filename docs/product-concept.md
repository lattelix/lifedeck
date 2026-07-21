# Second Brain OS: product concept

## Product thesis

Second Brain OS is a self-owned public profile built from verifiable activity.
It answers a simple question that a resume, a GitHub profile, and a calendar
cannot answer alone: what is this person actually working on and learning now?

The product has two surfaces:

1. **Public profile** - a controlled, shareable view of selected activity.
2. **Private OS** - connectors, classification, privacy rules, notes, booking,
   and personal automation.

The public profile is the product surface. The ingestion pipeline is the
infrastructure that makes it trustworthy.

## Primary audience

- The owner: one place to see whether attention matches priorities.
- Collaborators and clients: current context without asking for a status deck.
- Recruiters and professional peers: evidence of sustained work beyond GitHub.

## Core user promise

Open one URL and see:

- who the person is and what they are focused on;
- a life-wide activity graph for a clear time window;
- the exact activities behind each active day;
- the sources and projects that support every claim;
- only information the owner explicitly chose to publish.

## Trust model

The profile must never invent achievements or imply precision that a source did
not provide.

- Calendar duration can be displayed as time after privacy filtering.
- GitHub, LeetCode, and Codewars provide events, not verified work duration.
- Estimated weights may drive heatmap intensity internally, but the public UI
  presents exact event counts and source facts.
- Failed and empty sources remain distinguishable from healthy sources.
- Every public activity keeps `sourceId` and `itemId` provenance.

## Information architecture

### Overview

Identity, current focus, data freshness, active days, event count, connected
sources, and tracked projects. This is the default public profile view.

### Activity

The primary GitHub-style heatmap. Selecting a day reveals its confirmed events,
categories, source, project, and available duration. Filters follow the existing
Source -> Category -> Item hierarchy.

### Sources

Connected services with status, latest activity, covered projects, and a link to
the public source profile when available.

### Future modules

- **Private timeline:** Google/Apple Calendar and Obsidian ingestion with privacy
  rules and AI-assisted classification.
- **Booking:** owned availability rules, email confirmation, calendar writes,
  and embeddable booking links.
- **Ask me:** permission-aware answers grounded in selected Obsidian notes and
  public activity.
- **Embeds:** read-only heatmap, availability, and profile widgets with scoped
  public links.

## Contest MVP

The sprint delivers one complete vertical slice: a public living profile backed
by real GitHub, LeetCode, and Codewars adapters, automatic scheduled refresh,
source-aware filtering, and inspectable day-level evidence.

Google OAuth, booking, Obsidian editing, and the AI concierge are intentionally
outside the contest MVP. Their architectural boundaries are preserved, but the
interface does not pretend those modules already work.

## Product success criteria

- A visitor understands the profile in under 10 seconds.
- Every visible activity can be traced to a configured source and item.
- Empty or unavailable sources do not break the build or fabricate data.
- The profile refreshes without a manual local command.
- Desktop and mobile users can inspect activity without relying on hover.
