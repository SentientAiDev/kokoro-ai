# Kokoro Presence (MVP)

A persistent personal AI presence that builds continuity over time via an opt-in memory system.

## Quickstart
1. `pnpm install`
2. `cp .env.example .env`
3. `pnpm db:up` (or configure Supabase)
4. `pnpm db:migrate`
5. `pnpm dev`

## Core features (MVP)
- Daily voice/text journal entry
- Episodic summaries + “open loops”
- Opt-in preference memory
- Safe proactive check-ins (off by default)
- Transparent memory recall (“why”)

See docs in `/docs`.
