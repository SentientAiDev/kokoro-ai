# Security notes

## Logging + redaction

- Structured logs are emitted through `lib/infrastructure/logger.ts`.
- All log payloads pass through redaction (`lib/infrastructure/redaction.ts`).
- Secrets/PII patterns (email, phone, SSN, cards, token-like fields) are masked before logging.
- Memory writes, request logs, and error reporting use the same redaction utility.
- UI and API error handling now defaults to friendly user-safe messages while detailed context is kept in redacted server logs.

## Rate limiting

Rate limiting is enforced for:

- Auth POST endpoint (`/api/auth/[...nextauth]`)
- Journal writes (`POST`, `PUT`, `DELETE`)
- Preference memory writes
- Memory deletes
- Check-in write actions/settings update
- Check-in settings read and check-in suggestions read
- Daily check-in scheduler trigger endpoint (`/api/check-ins/run-daily-job`)
- Abuse report endpoint

Backend selection:

- Default: in-memory fixed window (development-safe and simple)
- Optional: Upstash Redis via `RATE_LIMIT_BACKEND=upstash` with
  `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

Blocked requests return HTTP 429 with retry metadata and generate a redacted
`rate_limit.blocked` event.

## CSRF + auth

- NextAuth email magic-link flow keeps its built-in CSRF protections for auth operations.
- Session-bearing API routes validate authenticated session before processing writes.

## Security headers

Middleware sets baseline response headers:

- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`

## Abuse reporting

- `POST /api/abuse` validates payloads with zod and stores reports in `AbuseReport`.
- Reports are redacted before persistence to reduce accidental sensitive-data retention.
