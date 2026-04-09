# STATE

## Current state
Status: M2 is closed; M3 live import is partially validated. A first live import succeeded with 50/50 uploaded orders after two import-path fixes, but repeated import rejects existing `externalId` values and the imported orders are stored in RetailCRM with `RUB` currency instead of the expected `KZT`. M4 remains blocked until those mismatches are explicitly resolved or accepted.

## Active branch
Checkpoint-review branch: `task/m3-live-checkpoint`
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

## In progress
- No new implementation beyond the M3 live import checkpoint
- M4 explicitly blocked pending a decision on repeated-import semantics and currency mismatch

## Next recommended step
Resolve the factual M3 mismatches before opening M4

Specific next action:
- decide whether repeated import must be treated as reject-on-duplicate or changed to update/no-op behavior
- resolve why RetailCRM persisted the imported orders as `RUB` although the import payload requested `KZT`
- only after those two points are accepted or corrected, open a new branch for M4

## Known blockers
- Re-running the same import returns HTTP `460` with per-order `externalId already exists` errors and zero uploaded orders
- Imported orders are stored in RetailCRM with currency `RUB`, not `KZT`
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
- the live import outcome is documented factually,
- M4 remains paused.

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
  - completed a first live import into RetailCRM site `garguliyadavid` with `Prepared orders: 50` and `Uploaded orders: 50`
- Intentionally deferred scope:
  - no RetailCRM-to-Supabase sync work
  - no alerting or sync reuse built on top of the import layer
  - no change yet to reject-on-duplicate repeated import behavior
  - no correction yet for the observed `RUB` currency persistence in the live account
- Verified invariants:
  - import logic stays server-side only
  - import-specific mapping is separated from generic RetailCRM transport
  - current app code does not import RetailCRM helpers or server-only env readers
  - first live import created 50 orders without uncontrolled duplication
  - repeated import is duplicate-safe in the narrow sense that RetailCRM rejects the same `externalId` values instead of creating extra orders
- Remaining unknowns:
  - whether reject-on-duplicate repeated imports are acceptable operator behavior or must be converted into update/no-op semantics before M4
  - why RetailCRM persisted the imported orders with `RUB` currency instead of the expected `KZT`
