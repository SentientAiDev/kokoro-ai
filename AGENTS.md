# Kokoro Presence — AGENTS.md

## Goal (MVP)
Build "Kokoro Presence": a persistent personal AI instance that feels continuous over time via:
- episodic memory (daily journal summaries)
- controlled long-term preference memory (with consent)
- proactive check-ins (strict rules)
- small actions (tasks, calendar later)

First ship a Web app (PWA-ready) + backend API + Postgres.
No phone calling in MVP.

## Non-goals (MVP)
- No outbound phone calls
- No financial trading features
- No medical/legal advice engine
- No autonomous actions without explicit user confirmation

## Tech Stack (fixed)
- Monorepo: pnpm workspaces
- Frontend: Next.js (TypeScript)
- Backend: Next.js API routes OR Nest/Express (choose simplest), TypeScript
- DB: Postgres + Prisma
- Auth: NextAuth (email magic link) OR Clerk (choose fastest)
- Testing: Vitest + Playwright (smoke)
- Lint/format: ESLint + Prettier
- Runtime: Node 20+

## Setup commands (must work)
- Install: `pnpm install`
- Dev: `pnpm dev`
- Test: `pnpm test`
- E2E (smoke): `pnpm e2e`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`

## Product rules
- Memory is opt-in. Store preferences only after explicit user consent.
- Always show “Why am I seeing this?” for recalled memories.
- All proactive notifications must be user-configurable and off by default.

## Security rules
- Never log raw secrets or full PII.
- Mask sensitive fields in logs.
- Add rate limiting to auth + API.
- Add a basic abuse policy + reporting endpoint.

## Definition of Done (for every PR)
- Feature implemented + unit tests
- Migrations included
- `pnpm test`, `pnpm lint`, `pnpm typecheck` pass
- Short PR description + screenshots for UI changes
- Update docs if behavior changes

## Workflow
- Use small PRs. One feature per PR.
- Prefer simple, boring solutions.
- If a decision is unclear, pick the simplest default and document it in /docs/decisions.md.
