# Kokoro Presence

T0 bootstrap for the Kokoro Presence MVP.

## Requirements

- Node.js 20+
- pnpm 10+

## Quickstart

```bash
pnpm install
pnpm dev
```

## Workspace commands

```bash
pnpm test
pnpm e2e
pnpm lint
pnpm typecheck
```

## Structure

- `apps/web`: Next.js TypeScript app router project
- `packages/shared`: shared TypeScript utilities
- `.github/workflows/ci.yml`: CI checks for lint, typecheck, and unit tests
