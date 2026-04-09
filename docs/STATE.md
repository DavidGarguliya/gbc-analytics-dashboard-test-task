# STATE

## Current state
Status: M2 data model slice implemented on task branch

## Active branch
Current working branch: `task/data-model`
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

## In progress
- M2 closeout on `task/data-model`

## Next recommended step
M3 — RetailCRM import

Specific next action:
- inspect `mock_orders.json`
- add `lib/retailcrm.ts`
- implement the import script for RetailCRM batch upload
- document operator steps and error reporting for the import flow

## Known blockers
- External accounts and credentials are not yet provisioned in the repository
- Actual RetailCRM API endpoint specifics are not yet verified
- `mock_orders.json` has not yet been mapped into RetailCRM payload semantics
- Final deployment settings depend on the chosen runtime implementation details

## Risks to watch
- overengineering during import adapter setup,
- accidental client exposure of secrets,
- schema drift between docs and implementation,
- sync design becoming ambiguous if cursor strategy is not kept explicit.

## Definition of health at this stage
Healthy if:
- docs are internally consistent,
- schema and Supabase helpers pass local quality gates,
- the next milestone is unambiguous.
