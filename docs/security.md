# Security baseline (MVP)

- Rate limit auth + write endpoints
- CSRF protection (if cookies)
- Validate inputs with zod
- Audit log for: memory writes, deletions, proactive notifications
- Redaction: do not store raw secrets/PII in logs
- Separate "memory writer" step (post-processing) to reduce drift

## Implemented guardrails (T0-T4 hardening pass)

- `POST /api/journal` validates payloads with zod and rejects malformed JSON payloads before business logic runs.
- `POST /api/journal` applies a per-user in-memory limiter (10 writes/minute) to reduce abusive bursts in MVP environments.
- Episodic summary writes are idempotent: if generated summary/topics/open loops are unchanged, summary and audit rows are not rewritten.
- Seed script error logging now emits only safe error messages instead of full error payloads.
