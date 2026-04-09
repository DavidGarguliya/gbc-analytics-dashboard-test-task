# STATE

## Current state
Status: M2 is closed. M3 is sufficiently validated for the test assignment after M3.1 live contract reconciliation. The contract of record is now explicit: the first live import succeeds with 50 uploaded orders, repeated import is rejected with HTTP `460` duplicate-`externalId` errors, the live account stores imported orders with `RUB`, and fixture `orderType=eshop-individual` is reconciled to the only supported live type, `main`. M4 can start safely against that contract when approved, but M4 is not approved yet.

## Active branch
Checkpoint-review branch: `task/m3-contract-reconciliation`
Canonical local integration branch: `feat/next-stage-baseline`

## Completed
- Baseline repository governance package created
- Core documents defined
- Architecture, data model, deployment, and test strategy documented
- ADR foundation defined
- Git repository initialized and baseline committed
- Next.js + TypeScript App Router scaffold added
- Baseline scripts added for `docs:golden`, `lint`, `typecheck`, `test`, and `build`
- CI workflow added for repository quality gates
- Initial environment helper and unit test added
- Baseline Supabase schema added
- Supabase client helpers added with explicit public/service-role separation
- Security posture refined for anon read access to `orders` only
- RetailCRM import foundation added with deterministic fixture mapping, site selection, and CLI entrypoint
- Checkpoint-review doc added for M2 and M3 before any sync work
- RetailCRM live import executed against a real account
- Import path updated to normalize object-shaped `sites` responses and deterministically fall back to the only available live `orderType`
- M3.1 live contract reconciliation completed
- Import path aligned to use the selected live site currency when available
- ADR-004 added to capture the live RetailCRM contract of record

## In progress
- No active implementation slice beyond M3.1 reconciliation
- M4 remains paused until separately approved

## Next recommended step
Wait for explicit approval to start M4 against the reconciled live RetailCRM contract

Specific next action:
- if approved, begin M4 sync against the actual values returned by RetailCRM, not the original fixture intent
- preserve `currency`, `orderType`, `status`, `site`, and `totalSumm` exactly as returned by RetailCRM
- evaluate Telegram high-value threshold later against the stored live-account amount field, with the actual stored currency included in the alert message

## Known blockers
- M4 is not approved yet
- Final deployment settings depend on the chosen runtime implementation details

## Risks to watch
- overengineering during import adapter setup,
- accidental client exposure of secrets,
- schema drift between docs and implementation,
- sync design becoming ambiguous if cursor strategy is not kept explicit.

## Definition of health at this stage
Healthy if:
- docs are internally consistent,
- import adapter code passes local quality gates,
- the live account contract of record is documented factually,
- M4 remains paused until approved.

## Milestone checkpoint status

### M2 — Data model and security foundation
- Planned scope:
  - add `supabase/schema.sql`
  - add Supabase client helpers with clear public/service-role boundaries
  - refine security and data-model docs against the implemented scaffold
- Implemented scope:
  - added [schema.sql](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/supabase/schema.sql)
  - added [supabase.ts](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/lib/supabase.ts) and [supabase.test.ts](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/lib/supabase.test.ts)
  - restricted anon/authenticated access to read-only `orders` policy, kept `sync_state` and `alerts_sent` private
- Intentionally deferred scope:
  - no sync queries, repositories, or data migration logic
  - no live Supabase connection verification
- Verified invariants:
  - service-role config rejects browser-like runtime
  - browser-safe config reads only public env vars
  - uniqueness and dedupe semantics are explicit in schema
- Remaining unknowns:
  - live Supabase project settings and RLS behavior are not yet exercised
  - real data mapping pressure on the schema is still unknown until sync runs

### M3 — RetailCRM import foundation
- Planned scope:
  - inspect `mock_orders.json`
  - add RetailCRM adapter
  - implement import script with clear logging and deterministic behavior
  - document operator flow and checkpoint assumptions
  - execute a live import against a real RetailCRM account before any M4 work
- Implemented scope:
  - inspected fixture shape and order totals
  - added [retailcrm-import.ts](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/lib/retailcrm-import.ts), [retailcrm.ts](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/lib/retailcrm.ts), and [import-retailcrm.ts](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/scripts/import-retailcrm.ts)
  - added deterministic `externalId` and `number` generation, site resolution, and fail-loud env handling
  - added checkpoint review doc and live-run checklist
  - fixed live-account import blockers by normalizing object-shaped `reference/sites` payloads and resolving unavailable fixture `orderType` codes to the only available live account type (`main`)
  - aligned import payload currency with the selected live site currency when available
  - completed a first live import into RetailCRM site `garguliyadavid` with `Prepared orders: 50` and `Uploaded orders: 50`
- Intentionally deferred scope:
  - no RetailCRM-to-Supabase sync work
  - no alerting or sync reuse built on top of the import layer
  - no change to reject-on-duplicate repeated import behavior
- Verified invariants:
  - import logic stays server-side only
  - import-specific mapping is separated from generic RetailCRM transport
  - current app code does not import RetailCRM helpers or server-only env readers
  - first live import created 50 orders without uncontrolled duplication
  - repeated import is duplicate-safe in the narrow sense that RetailCRM rejects the same `externalId` values instead of creating extra orders
- Remaining unknowns:
  - none that block M4 once the reconciled live contract is accepted

### M3.1 — Live Contract Reconciliation
- Planned scope:
  - document the factual live-account behavior
  - analyze mismatches between the planned import contract and the observed live contract
  - choose the smallest safe adaptation before any sync work
  - update the governing docs and add a dedicated contract note if needed
- Implemented scope:
  - recorded that the first live import succeeded with 50 uploaded orders
  - recorded that repeated import returns HTTP `460` with duplicate `externalId` errors and zero uploaded orders
  - recorded that imported live orders are stored with `currency = RUB`
  - recorded that fixture `orderType=eshop-individual` is unsupported in the live account and is currently reconciled to `main`
  - chose strategy **B**: align the import payload with live account defaults where metadata is available, while treating the stored RetailCRM order as the downstream contract of record
  - added [ADR-004 — Live RetailCRM contract of record](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/docs/ADR/ADR-004-live-retailcrm-contract.md)
- Intentionally deferred scope:
  - no M4 sync implementation
  - no dashboard changes
  - no Telegram implementation changes
- Verified invariants:
  - no code changes outside the import path
  - sync/dashboard/alert layers remain untouched
  - the contract of record is now explicit for future phases
- Remaining unknowns:
  - a different RetailCRM account could expose different supported `orderType` or currency defaults, but the current project now targets the observed live account contract only
