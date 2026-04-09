# ADR-005 — Currency contract realignment to KZT

## Status
Accepted

## Context
ADR-004 captured the live RetailCRM demo account as it existed during the first live import checkpoint: the account returned `RUB`, and downstream phases were implemented against that observed state to avoid pretending the upstream contract was something else.

Before starting M6, the assignment requirement for Kazakhstani tenge was re-opened explicitly. The live account was inspected again on 2026-04-10 and showed:
- exactly one accessible site, `garguliyadavid`,
- exactly one configured currency, base currency `RUB`,
- 50 existing imported demo orders, all returned by RetailCRM with `currency = RUB`,
- an API key with `reference_write`, including `/api/v5/reference/currencies/{id}/edit` and `/api/v5/reference/sites/{code}/edit`.

The upstream account was then corrected first, not the dashboard or Supabase:
- base currency `id = 2` was edited from `RUB` to `KZT`,
- the accessible site now returns `currency = KZT`,
- the existing imported demo orders now return `currency = KZT` from RetailCRM,
- no client-side currency relabeling or Supabase-only patching was required.

## Decision
Treat the current live RetailCRM account, after the upstream currency correction, as the new contract of record:
- `KZT` is now the authoritative live currency for downstream sync, dashboard, and later Telegram alerts,
- downstream systems must still use the values returned by RetailCRM, not fixture intent or UI-side overrides,
- a rerun of RetailCRM -> Supabase sync is the required propagation mechanism after the upstream change,
- no currency conversion logic is introduced,
- no dashboard-side reinterpretation is allowed.

## Consequences
Positive:
- the live contract now matches the assignment currency requirement,
- downstream behavior remains truthful because the change happened upstream first,
- existing import, sync, and dashboard code can stay simple because they already read stored live values as-is.

Negative:
- historical documents and logs that recorded the earlier `RUB` checkpoint must now be read as historical evidence, not as current truth,
- future contract changes must again be handled upstream first and then propagated by sync, not by patching the dashboard.

## Supersedes
- ADR-004 remains historically accurate for the original live checkpoint,
- ADR-005 supersedes ADR-004 specifically for current currency semantics.
