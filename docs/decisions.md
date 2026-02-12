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
