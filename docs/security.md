# Security & Safety

## Logging and redaction

- Structured JSON logging is used for API requests, rate-limit warnings, and error reporting.
- `redactSensitiveJson` and `redactSensitiveText` remove direct PII and secret-like fields from logs and persisted metadata.
- Memory writes pass through redaction before persistence.

## Rate limiting

- Write endpoints and auth endpoints are rate-limited.
- Default backend is in-memory (development-safe and deterministic).
- Optional Upstash Redis backend can be enabled with:
  - `RATE_LIMIT_DRIVER=upstash`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- Rate-limit violations return `429` with retry metadata and emit redacted warning logs.

## Abuse reporting

- `POST /api/abuse` accepts validated safety reports.
- Reports are persisted to `AuditLog` with action `abuse.reported` and redacted metadata.

## CSRF and headers

- NextAuth keeps built-in CSRF protections on auth flows.
- Middleware enforces same-origin checks for non-GET API requests (excluding `/api/auth`).
- Middleware sets baseline hardening headers:
  - CSP
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy
  - Permissions-Policy
