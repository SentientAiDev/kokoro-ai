# Decisions (ADR-lite)

- 0001: Use pnpm workspaces with `apps/web` and `packages/shared` for a simple TypeScript monorepo bootstrap.
- 0002: Use Next.js App Router for the web app and future API routes in the same runtime.
- 0003: Keep linting and formatting at repository root with ESLint + Prettier for consistent standards.
- 0004: Use Vitest for unit tests and Playwright for a minimal smoke test baseline.
- 0005: Add a GitHub Actions CI workflow that runs lint, typecheck, and unit tests.
- 0006: Use Postgres (Docker Compose) + Prisma schema/migrations under `apps/web/prisma` to keep database concerns colocated with the Next.js app for MVP speed.
- 0007: Harden CI/restricted-env behavior by using a GitHub Actions Postgres service container, running `prisma migrate deploy` against `DATABASE_URL`, and supporting `PRISMA_SKIP_GENERATE=1` so lint/typecheck/test can run when Prisma client generation is unavailable.

- 0008: Implement auth with NextAuth email magic links and Prisma Adapter for the fastest MVP-compatible, passwordless sign-in flow.

- 0009: Implement T4 episodic memory as a deterministic rule-based pipeline (keyword topic extraction + open-loop heuristics) triggered immediately after journal entry creation, with audit logging for each generated summary.

- 0010: Enforce idempotent episodic-memory writes by skipping unchanged summary updates/audit logs to prevent duplicate writes during retries.
- 0011: Add lightweight per-user in-memory rate limiting on journal write API (`POST /api/journal`) as a simple MVP abuse-control default.
- 0012: Treat `apps/web/prisma/schema.prisma` as the canonical data model and require committed migrations to match schema changes, documented in root setup instructions.
