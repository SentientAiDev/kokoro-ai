# Architecture Overview

## Layered structure

- **Presentation layer**: Next.js routes and React pages/components under `apps/web/app` and `apps/web/components`.
- **Application layer**: Use-cases and orchestration under `apps/web/lib/application`.
- **Domain logic**: Memory summarization/open-loop extraction in `apps/web/lib/episodic-summary.ts` and logic encapsulated by `MemoryService`.
- **Infrastructure**: Prisma, auth, structured logging, rate limiting, and middleware security controls under `apps/web/lib` and `apps/web/middleware.ts`.

## Data flow

1. Request enters API route (presentation).
2. Route validates input with zod and applies rate limits.
3. Route calls an application service (no business logic in route).
4. Service executes domain behavior and persists via Prisma.
5. Structured logs are emitted with redaction.

## Memory lifecycle

1. Journal entry is created.
2. `onJournalEntryCreated` event is emitted.
3. `MemoryService.writeEpisodicSummary` generates deterministic episodic summary + open loops.
4. Memory is redacted before persistence.
5. Recall queries always route through `MemoryService.recall`.
6. Preference memory writes are consent-gated in `MemoryService.writePreferenceMemory`.

## Check-in lifecycle

1. User journals, triggering journal-created event.
2. Event runs episodic update and check-in suggestion generation.
3. Suggestion actions (`dismiss`, `snooze`, `done`) are validated and rate-limited.
4. Audit events are stored for traceability.
