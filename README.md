# Kokoro Presence (MVP)

A persistent personal AI presence that builds continuity over time via an opt-in memory system.

## Monorepo layout

- `apps/web`: Next.js App Router frontend + API host
- `apps/web/prisma`: Prisma schema, migrations, and seed script
- `packages/shared`: Shared TypeScript constants/utilities
- `tests/e2e`: Playwright smoke tests

## Quickstart

1. `pnpm install`
2. `cp .env.sample apps/web/.env`
3. `pnpm db:up`
4. `pnpm db:migrate`
5. `pnpm db:seed`
6. `pnpm dev`
7. `pnpm lint`
8. `pnpm typecheck`
9. `pnpm test`
10. `pnpm e2e`

> Prisma commands run in `apps/web`, so the env file needs to live at `apps/web/.env` for `DATABASE_URL` to be picked up during migrate/seed.

## Database (T1)

- Postgres runs via `docker compose` (`docker-compose.yml`)
- Prisma schema is the source of truth at `apps/web/prisma/schema.prisma`; migrations in `apps/web/prisma/migrations` must stay in sync with schema changes.
- Apply committed migrations with `pnpm db:deploy` for non-interactive environments and use `pnpm db:migrate` for local development.
- Seed data is defined in `apps/web/prisma/seed.ts`.
- If installs run with ignored lifecycle scripts, run `pnpm --filter web prisma:generate` before using Prisma Client.

## Auth (T2)

- NextAuth is configured with email magic-link login.
- Required env vars: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `EMAIL_SERVER`, `EMAIL_FROM`.
- API route: `/api/auth/[...nextauth]`
- UI routes: `/login` and `/account`

## Journal UI (T3)

- Create a text journal entry at `/journal`.
- View your own journal entries list at `/journal`.
- Open entry details at `/journal/[id]`.
- API endpoint for creation: `POST /api/journal`.

## Core features (MVP)

- Daily voice/text journal entry
- Episodic summaries + “open loops”
- Opt-in preference memory
- Safe proactive check-ins (off by default)
- Transparent memory recall (“why”)

See docs in `/docs`.
