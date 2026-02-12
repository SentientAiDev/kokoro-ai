# Decisions (ADR-lite)

- 0001: Use pnpm workspaces with `apps/web` and `packages/shared` for a simple TypeScript monorepo bootstrap.
- 0002: Use Next.js App Router for the web app and future API routes in the same runtime.
- 0003: Keep linting and formatting at repository root with ESLint + Prettier for consistent standards.
- 0004: Use Vitest for unit tests and Playwright for a minimal smoke test baseline.
- 0005: Add a GitHub Actions CI workflow that runs lint, typecheck, and unit tests.
