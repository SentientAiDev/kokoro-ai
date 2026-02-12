# Architecture

## Layered structure

The codebase now follows four layers:

1. **Presentation layer**
   - Next.js pages/components in `apps/web/app` and `apps/web/components`.
   - API routes only parse/validate request input and call application services.
2. **Application layer**
   - `apps/web/lib/application/*` contains use-case orchestration.
   - `JournalService` handles journal entry use-cases.
   - `MemoryService` centralizes all memory behavior.
3. **Domain layer**
   - `apps/web/lib/domain/memory-processing.ts` contains memory processing rules
     (summary/open-loop derivation + redaction-ready output).
4. **Infrastructure layer**
   - Prisma (`lib/prisma.ts`), logging, rate limiting, redaction, HTTP helpers, and auth wiring.

## Reliability & UX hardening additions

- A shared client-side API error parser (`apps/web/lib/client/http.ts`) normalizes user-facing error messages and retry hints (including rate-limit retry metadata).
- Critical API routes now wrap service/database calls in guarded error handling and emit redacted structured error events.
- A global Next.js `app/error.tsx` boundary prevents raw stack traces from leaking into user flows and provides a retry affordance.
- Check-in generation now enforces both the configured daily cap and check-in window at generation time.

## Data flow

### Journal write flow

`POST /api/journal` -> validate with zod -> `JournalService.createEntry` -> publish `journal-entry.created` event -> `MemoryService.writeEpisodicSummaryFromJournal` -> episodic summary + audit log.

This keeps route logic thin while ensuring memory updates happen through one service boundary.

### Memory lifecycle

1. Journal entries generate episodic summaries through `MemoryService`.
2. Preference memories are written only through `MemoryService.writePreferenceMemory` and require explicit consent.
3. Redaction is consistently applied in memory writes and structured logs.
4. Recall requests route through `MemoryService.recall`.
5. Memory deletion routes through `MemoryService.deleteMemory` and records audit events.

### Check-in lifecycle

1. Scheduler inspects notification settings and recent summaries.
2. Eligibility checks include user enablement, configured window, and per-day cap.
3. Eligible users receive generated suggestions.
4. Suggestion actions (`dismiss`, `snooze`, `done`) are validated and applied through service functions.
5. Status changes are audited.

## Security touchpoints

- Rate limits are applied on auth POST and all critical write/read endpoints for memory and check-ins.
- Structured logs redact sensitive values.
- `/api/abuse` captures abuse/security reports with validation and rate limit.
