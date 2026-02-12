# Kokoro Presence (MVP)

A persistent personal AI presence that builds continuity over time via an opt-in memory system.

## Monorepo layout
- `apps/web`: Next.js App Router frontend + API host
- `packages/shared`: Shared TypeScript constants/utilities
- `tests/e2e`: Playwright smoke tests

## Quickstart
1. `pnpm install`
2. `pnpm dev`
3. `pnpm lint`
4. `pnpm typecheck`
5. `pnpm test`
6. `pnpm e2e`

## Core features (MVP)
- Daily voice/text journal entry
- Episodic summaries + “open loops”
- Opt-in preference memory
- Safe proactive check-ins (off by default)
- Transparent memory recall (“why”)

See docs in `/docs`.
