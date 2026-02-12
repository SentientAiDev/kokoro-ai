# PRD — Kokoro Presence (MVP)

## Problem
Chatbots feel “dead” because they lack continuity: no time model, no memory policy, no initiative.

## Target user
A single user (Lima) for v0, then small private beta.

## MVP scope
1) Journal
- Create entry (text now, voice later)
- Tag mood (optional)
- “What matters today?” prompt

2) Episodic memory
- After each entry: generate a summary + open loops
- Timeline view
- Search

3) Preference memory (opt-in)
- Store: language preference, reminder style, working hours
- Must require explicit consent per item

4) Recall
- When answering: retrieve relevant episodic items and show citations in UI
- “Why this memory” explainer

5) Proactive check-ins (off by default)
- Configurable schedule + rules
- Never more than 1/day by default
- Must be explainable and dismissible

## Out of scope
Phone calls, external automation, third-party integrations.

## Success criteria
- User can use it daily for 7 days
- Memory recall is correct and non-creepy
- No accidental storage of sensitive data without consent
