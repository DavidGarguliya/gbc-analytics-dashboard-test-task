# STATE

## Current state
Status: M1 scaffold integrated into local baseline

## Active branch
Current working branch: `feat/next-stage-baseline`
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

## In progress
- No active implementation slice

## Next recommended step
M2 — Data model and security foundation

Specific next action:
- add `supabase/schema.sql`
- add Supabase client helpers with clear server/client boundaries
- refine docs against the implemented scaffold and schema
- inspect `mock_orders.json` to prepare the later import slice

## Known blockers
- External accounts and credentials are not yet provisioned in the repository
- Actual RetailCRM API endpoint specifics are not yet verified
- Final deployment settings depend on the chosen runtime implementation details

## Risks to watch
- overengineering during schema and adapter setup,
- accidental client exposure of secrets,
- schema drift between docs and implementation,
- sync design becoming ambiguous if cursor strategy is not kept explicit.

## Definition of health at this stage
Healthy if:
- docs are internally consistent,
- the scaffold passes local quality gates,
- the next milestone is unambiguous.
