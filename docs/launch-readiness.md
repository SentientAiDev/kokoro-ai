# Launch readiness

## Deployment target

Recommended production stack:

- **Frontend/API runtime:** Vercel (Next.js App Router)
- **Database:** Neon Postgres (recommended for simplicity) or Supabase Postgres
- **Auth:** NextAuth email magic links

## Vercel deployment steps

1. Push the repository to GitHub.
2. In Vercel, click **Add New Project** and import this repo.
3. Configure:
   - Framework preset: `Next.js`
   - Root directory: repo root
   - Install command: `pnpm install`
   - Build command: `pnpm --filter web build`
4. Add production environment variables (see checklist below).
5. Set `DATABASE_URL` to your Neon/Supabase pooled connection string.
6. Run migrations before first production traffic:
   - `pnpm db:migrate`
7. Deploy.
8. Verify health endpoint:
   - `GET /api/health` returns `200` and `{ status: "ok", db: "ok" }`.

## Neon Postgres quick setup

1. Create a Neon project and database.
2. Copy the pooled `postgresql://` connection string.
3. Set `DATABASE_URL` in Vercel.
4. Apply migrations with `pnpm db:migrate`.

## Production checklist

### Environment variables

- `DATABASE_URL`
- `NEXTAUTH_URL` (your production domain)
- `NEXTAUTH_SECRET` (long random secret)
- `EMAIL_SERVER` (SMTP URL)
- `EMAIL_FROM` (verified sender)

### Authentication

- Confirm magic link email delivery in production SMTP.
- Verify signin and signout from production domain.
- Verify auth endpoints are rate-limited.

### Database

- Migrations are applied.
- Backups / point-in-time recovery enabled in provider.
- `/api/health` reports db `ok`.

### Logging and security

- Do not log raw secrets or full PII.
- Sensitive input is redacted before persistence in abuse/feedback endpoints.
- API rate limiting is active.
- Abuse reporting endpoint (`/api/abuse`) is reachable.
