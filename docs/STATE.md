# STATE

## Current state
Status: M2 and M3 checkpoint-review prepared; M2 is closed, M3 foundation is closed, live import verification is pending, and M4 is blocked until the live import succeeds

## Active branch
Checkpoint-review branch: `task/checkpoint-review`
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

## In progress
- M3 live RetailCRM import verification only
- M4 explicitly blocked pending successful live import

## Next recommended step
Run the live M3 import checkpoint

Specific next action:
- provide valid RetailCRM credentials
- run `npm run import:retailcrm`
- verify all 50 orders import successfully into RetailCRM
- collect evidence from the live run
- only after a valid import checkpoint, open a new branch for M4

## Known blockers
- External accounts and credentials are not yet provisioned in the repository
- Live RetailCRM import has not been executed yet because credentials are unavailable
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
- the remaining external verification step is explicit,
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
- Implemented scope:
  - inspected fixture shape and order totals
  - added [retailcrm-import.ts](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/lib/retailcrm-import.ts), [retailcrm.ts](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/lib/retailcrm.ts), and [import-retailcrm.ts](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/scripts/import-retailcrm.ts)
  - added deterministic `externalId` and `number` generation, site resolution, and fail-loud env handling
  - added checkpoint review doc and live-run checklist
- Intentionally deferred scope:
  - no live RetailCRM import run yet
  - no RetailCRM-to-Supabase sync work
  - no alerting or sync reuse built on top of the import layer
- Verified invariants:
  - import logic stays server-side only
  - import-specific mapping is separated from generic RetailCRM transport
  - current app code does not import RetailCRM helpers or server-only env readers
- Remaining unknowns:
  - exact RetailCRM acceptance behavior for repeated `externalId` uploads is unverified until live run
  - site availability and upload response shape must be confirmed against a real account
