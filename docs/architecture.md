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

## Data flow

### Journal write flow

`POST /api/journal` -> validate with zod -> `JournalService.createEntry` -> publish `journal-entry.created` event -> `MemoryService.writeEpisodicSummaryFromJournal` -> episodic summary + audit log.

This keeps route logic thin while ensuring memory updates happen through one service boundary.

### Memory lifecycle

1. Journal entries generate episodic summaries through `MemoryService`.
2. Preference memories are written only through `MemoryService.writePreferenceMemory` and require explicit consent.
3. Redaction is consistently applied in memory writes and structured logs.
4. Recall requests route through `MemoryService.recall`.
5. Memory deletion routes through `MemoryService.deleteMemory`.

### Check-in lifecycle

1. Scheduler inspects notification settings and recent summaries.
2. Eligible users receive generated suggestions.
3. Suggestion actions (`dismiss`, `snooze`, `done`) are validated and applied through service functions.
4. Status changes are audited.

## Security touchpoints

- Rate limits are applied on auth POST and all write endpoints.
- Structured logs redact sensitive values.
- `/api/abuse` captures abuse/security reports with validation and rate limit.
