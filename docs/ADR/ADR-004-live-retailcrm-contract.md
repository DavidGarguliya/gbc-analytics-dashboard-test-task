# ADR-004 — Live RetailCRM contract of record

## Status
Accepted, later superseded in currency semantics by ADR-005

## Context
Note:
- this ADR remains historically accurate for the first live checkpoint,
- current currency semantics are superseded by [ADR-005](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/docs/ADR/ADR-005-kzt-currency-realignment.md).

The M3 live import checkpoint exposed behavior in the real RetailCRM demo account that differs from the original fixture-oriented assumptions:
- the first live import succeeds and creates 50 orders,
- repeating the same import with the same `externalId` values returns HTTP `460` and duplicate-`externalId` errors,
- the live account stores the imported orders with `currency = RUB`,
- fixture `orderType=eshop-individual` is not supported by the live account, which currently exposes only `main`.

M4 sync, later dashboard metrics, and Telegram alert logic need one explicit contract of record before any implementation starts. Without that reconciliation, downstream code would risk mixing fixture intent with actual upstream state.

## Decision drivers
- keep scope small and reviewable,
- avoid hidden assumptions before sync,
- preserve deterministic downstream behavior,
- isolate any required fix to the import path only,
- prefer the actual live account contract over speculative portability.

## Decision
Choose strategy **B**: adjust the import mapping so the payload aligns better with the live account defaults where metadata is available, and treat the stored live RetailCRM order as the downstream contract of record.

Concretely:
- import continues to use deterministic `externalId` values,
- unsupported fixture `orderType` values are reconciled deterministically to the supported live account type,
- the import payload uses the selected live site's currency when the site metadata exposes it,
- repeated import is treated as a duplicate-safe seed-import behavior, not as a general update/no-op path,
- downstream sync, dashboard, and Telegram phases must use the values returned by RetailCRM after import, especially `currency`, `totalSumm`, `status`, `site`, and `orderType`,
- the high-value alert threshold is evaluated against the stored upstream numeric amount; the alert message must include the stored currency and no implicit currency conversion is introduced.

## Consequences
Positive:
- the repository has one explicit operational contract before M4,
- import payload intent now aligns better with the observed live account defaults,
- downstream phases can be implemented against stable upstream semantics,
- no change is required outside the import path.

Negative:
- the operational contract is now explicitly tied to the observed live demo account behavior,
- repeated import is not an idempotent success path,
- the assignment's original `KZT` wording is narrowed operationally to the live account's stored currency of record.

## Rejected alternatives
- **A) Keep import as-is and treat the live account behavior as the contract of record**
  - rejected because it would leave the import payload intentionally misaligned with the live site's stored currency.
- **C) Narrow the project contract in documentation only**
  - rejected because one small import-path alignment is safer than preserving a known payload-vs-account mismatch.
