# ADR-002 — Sync strategy

## Status
Accepted

## Context
The system must copy orders from RetailCRM into Supabase and tolerate repeated runs without creating duplicates or ambiguous state.

## Decision
Implement synchronization as an explicit, idempotent pull process:
- fetch orders or order history from RetailCRM,
- transform records into local storage shape,
- upsert into `orders` keyed by `retailcrm_id`,
- persist sync progress in `sync_state`.

The exact RetailCRM API endpoint details may be refined at implementation time, but the architectural contract remains:
- explicit progress tracking,
- explicit upsert semantics,
- durable local persistence.

## Consequences
Positive:
- simple recovery model,
- rerun-safe behavior,
- easy to explain and verify,
- dashboard is decoupled from upstream availability.

Negative:
- requires a small amount of state tracking,
- may need pagination/cursor handling depending on endpoint choice.

## Rejected alternatives
- direct dashboard reads from RetailCRM,
- stateless full reload on every page load,
- webhook-only synchronization without durable local cursor semantics.
