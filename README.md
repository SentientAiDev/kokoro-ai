# Kokoro Presence

Kokoro Presence is a personal AI presence designed to feel continuous over time, not stateless from one chat to the next. Instead of only reacting in the moment, it builds memory through a simple loop: **journal -> episodic memory -> recall -> proactive check-ins**. The result is an assistant that can remember context over days and weeks while staying under user control.

## Why this is different from a normal AI chatbot

Most chatbots are session-based: once the conversation ends, continuity is limited unless you manually repeat context. Kokoro is built around persistent, explicit memory with traceability. When it recalls something, it shows **"Why this memory?"**, and preference memory is stored only with consent.

## Key features

- Daily interaction through journaling today (text now, voice soon)
- Episodic memory summaries generated from journal entries
- Memory recall with a visible **"Why this memory?"** explanation
- Opt-in preference memory (never assumed)
- Proactive but limited check-ins (user-configurable, off by default)
- Full user control to review and delete stored memories

## How it works

1. You write (and soon talk) about your day.
2. Kokoro extracts meaningful points from those interactions.
3. It creates episodic memories and, when explicitly allowed, preference memories.
4. Later, Kokoro can reference those memories in relevant moments and explain why they were recalled.

## Privacy and control

- No raw secret logging
- Consent required before saving preference memory
- Stored memories can be deleted anytime by the user

## Project structure overview

- `apps/web` — Next.js App Router frontend and API routes
- `apps/web/prisma` — Prisma schema, migrations, and seed script
- `packages/shared` — Shared TypeScript utilities/constants
- `tests/e2e` — Playwright smoke tests
- `docs` — Product and technical documentation

## Running locally

1. `pnpm install`
2. `cp .env.sample apps/web/.env`
3. `pnpm db:up`
4. `pnpm db:migrate`
5. `pnpm db:seed`
6. `pnpm dev`

Useful checks:

- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm e2e`

> Prisma commands run in `apps/web`, so `apps/web/.env` must contain `DATABASE_URL` for migrate/seed to work.

## Production deploy

See [docs/launch-readiness.md](docs/launch-readiness.md) for:

- Vercel deployment instructions
- Neon/Supabase Postgres setup notes
- Production checklist for env vars, auth, DB, and logging
- `/api/health` verification
