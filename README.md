# Kokoro Presence (MVP)

A persistent personal AI presence that builds continuity over time via an opt-in memory system.

## Monorepo layout
- `apps/web`: Next.js App Router frontend + API host
- `apps/web/prisma`: Prisma schema, migrations, and seed script
- `packages/shared`: Shared TypeScript constants/utilities
- `tests/e2e`: Playwright smoke tests

## Quickstart
1. `pnpm install`
2. `cp .env.sample .env`
3. `pnpm db:up`
4. `pnpm db:migrate`
5. `pnpm db:seed`
6. `pnpm dev`
7. `pnpm lint`
8. `pnpm typecheck`
9. `pnpm test`
10. `pnpm e2e`

## Database (T1)
- Postgres runs via `docker compose` (`docker-compose.yml`)
- Prisma schema includes MVP models: `User`, `JournalEntry`, `EpisodicSummary`, `PreferenceMemory`, `AuditLog`, `NotificationSetting`
- Seed data is defined in `apps/web/prisma/seed.ts`

## Auth (T2)
- NextAuth is configured with email magic-link login.
- Required env vars: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `EMAIL_SERVER`, `EMAIL_FROM`.
- API route: `/api/auth/[...nextauth]`
- UI routes: `/login` and `/account`

## Core features (MVP)
- Daily voice/text journal entry
- Episodic summaries + “open loops”
- Opt-in preference memory
- Safe proactive check-ins (off by default)
- Transparent memory recall (“why”)

See docs in `/docs`.
