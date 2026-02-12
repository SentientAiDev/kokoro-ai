# Security baseline (MVP)

- Rate limit auth + write endpoints
- CSRF protection (if cookies)
- Validate inputs with zod
- Audit log for: memory writes, deletions, proactive notifications
- Redaction: do not store raw secrets/PII in logs
- Separate “memory writer” step (post-processing) to reduce drift
