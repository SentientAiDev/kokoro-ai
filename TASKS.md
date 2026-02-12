# Kokoro Presence — Tasks (in order)

## T0 — Repo bootstrap
- Setup pnpm monorepo (apps/web, packages/shared)
- Add Next.js TS app
- Add ESLint/Prettier
- Add Vitest
- Add Playwright smoke test
- Add CI workflow (lint/typecheck/test)

## T1 — Database + Prisma
- Docker compose for Postgres
- Prisma schema: User, JournalEntry, EpisodicSummary, PreferenceMemory, AuditLog, NotificationSetting
- Migrations and seed

## T2 — Auth
- Implement NextAuth (email magic link) OR Clerk
- Minimal account screen

## T3 — Journal UI
- Create entry
- List entries
- View entry

## T4 — Memory pipeline (no external LLM required yet)
- Deterministic summarizer stub (rule-based) so app works offline
- Store summary + open loops

## T5 — Plug LLM summarizer (feature flag)
- Add LLM summarization behind env flag
- Add redaction pass before write

## T6 — Recall UI
- Search + timeline
- “Why this memory?” panel
- Delete memory items

## T7 — Proactive check-ins (off by default)
- Settings UI
- Background job (cron-like) that creates a “check-in suggestion”
- In-app notification (no push yet)

## T8 — Hardening
- Rate limiting
- Logging + redaction
- Basic abuse report endpoint
- Add tests for consent + redaction

## T9 — Deployment
- Vercel deploy + DB provider instructions
- Production env checklist
