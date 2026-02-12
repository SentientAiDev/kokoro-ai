# Decisions log

## 2026-10-16 — T8 hardening implementation

- Adopted a layered architecture split:
  - presentation (`app/`, `components/`)
  - application (`lib/application/*`)
  - domain (`lib/domain/*`)
  - infrastructure (`lib/infrastructure/*`)
- Centralized memory behavior in `MemoryService` to avoid direct memory-table access from routes.
- Introduced event-driven journal flow: journal create emits an event consumed by memory generation.
- Chose fixed-window rate limiting as the default with optional Upstash backend behind env flag,
  to keep local dev simple while allowing distributed enforcement in production.
- Added structured logging with shared redaction utility and unified error reporting hooks.
- Added `AbuseReport` persistence model and `/api/abuse` endpoint with zod validation.
- Added baseline security headers via Next.js middleware.

## 2026-02-12 — Product polish v1 information architecture

- Reframed app navigation around five user-facing hubs: Today, Journal, Memory, Check-ins, Settings.
- Added a dedicated Trust Center page with explicit storage policy language and one-click memory purge.
- Kept defaults conservative by preserving proactive check-ins as opt-in/off by default, including onboarding copy and controls.
- Consolidated first-run clarity into a lightweight onboarding card explaining journal → memory → recall → check-ins loop.

## 2026-02-12 — Launch readiness defaults

- Chose **Vercel + Neon Postgres** as the default production recommendation to keep deployment simple for MVP teams.
- Added a lightweight `/api/health` route that verifies API availability plus DB connectivity using `SELECT 1`.
- Added in-app feedback capture persisted to `FeedbackMessage` with request rate-limiting and redaction to avoid storing raw sensitive inputs.
