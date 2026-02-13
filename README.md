# Kokoro Presence

Kokoro Presence is a personal AI presence designed to feel continuous over time through a loop of **journal -> episodic memory -> recall -> proactive check-ins**.

## Guest mode + optional auth

Authentication is optional by default. You can use all core product flows without signing in:

- journaling
- episodic memory + recall with “Why am I seeing this?”
- settings
- proactive check-ins

Guest mode uses a signed, HttpOnly cookie (`kokoro_guest`) to maintain a stable device identity. Guest data is persisted server-side in Postgres under a guest user record, and can be upgraded to an account after login.

### Environment flags

- `AUTH_REQUIRED=false` — if `true`, authenticated sessions are required.
- `DEV_AUTH_BYPASS=false` — enables dev-only credentials auth (never intended for production).
- `E2E_ENABLED=false` — gates Playwright smoke execution in restricted envs.
- Email auth is enabled only when both `EMAIL_SERVER` and `EMAIL_FROM` are set.

## Running locally

1. `pnpm install`
2. `cp .env.sample apps/web/.env`
3. `pnpm db:up`
4. `pnpm db:migrate`
5. `pnpm db:seed`
6. `pnpm dev`

Useful checks:

- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm e2e`
