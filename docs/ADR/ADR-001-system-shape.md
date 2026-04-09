# ADR-001 — System shape

## Status
Accepted

## Context
The assignment requires integrating RetailCRM, Supabase, Vercel, and Telegram in a small but reviewable delivery. A fragmented architecture would add cost without adding assignment value.

## Decision
Use a single repository with a unified TypeScript/Next.js-centered delivery shape:
- one web app repository,
- thin integration adapters,
- operational scripts for import/sync/alerts where appropriate,
- Supabase as persisted read model,
- Vercel as deployment target for the dashboard.

## Consequences
Positive:
- reduced context switching,
- easier review and README explanation,
- fewer moving parts,
- cleaner CI and deployment story.

Negative:
- some operational actions may still be script-based instead of purely web-native,
- careful client/server boundary handling is required.

## Rejected alternatives
- multi-service decomposition,
- Python backend + separate frontend,
- event-driven architecture with queues.

These were rejected as disproportionate to the assignment scope.
