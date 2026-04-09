# PROJECT_CONTEXT

## Project
AI Tools Specialist test assignment — build a minimal order dashboard using RetailCRM, Supabase, Vercel, and Telegram.

## Objective
Deliver a compact but production-shaped implementation that demonstrates the ability to:
- integrate third-party systems,
- move data safely between systems,
- create a deployable dashboard,
- automate a business notification,
- use an AI coding agent under explicit governance.

## Required outcome
1. RetailCRM demo account configured
2. Supabase project configured
3. Vercel deployment working
4. Telegram bot configured
5. 50 test orders imported into RetailCRM from `mock_orders.json`
6. RetailCRM orders synchronized into Supabase
7. Dashboard rendered from Supabase data
8. Telegram notification sent when order amount exceeds 50,000 KZT
9. Repository README explains prompts used with Codex, blockers, and resolutions

## Project framing
This is a **small system with real integrations**, not a toy single-file script.
However, it must remain compact and easy to review. The goal is **sound engineering with controlled scope**, not a showcase of unnecessary architecture.

## Primary success criteria
- Reviewer can understand the repository quickly.
- Setup is reproducible from README.
- Sensitive credentials are handled correctly.
- Sync and alert behavior are deterministic.
- Final system visibly works end-to-end.

## Non-goals
The following are explicitly out of scope unless required by a later decision:
- user authentication,
- multi-tenant support,
- role-based access control,
- realtime push architecture,
- background workers or queues,
- microservices,
- advanced BI/reporting,
- event sourcing,
- generalized integration framework.

## Operating principle
This repository is executed in **spec-first, invariant-driven mode**:
- documents govern implementation,
- architecture is kept small,
- durable decisions are recorded in ADRs,
- each implementation slice closes with docs sync and atomic commits.

## External systems
- RetailCRM: upstream source for orders
- Supabase: storage and dashboard read model
- Vercel: web deployment target
- Telegram Bot API: alert channel

## Quality priorities
1. Security
2. Correctness
3. Idempotent synchronization
4. Minimal operational complexity
5. Clear documentation
6. Reviewable git history

## Expected repository state by final delivery
- working application code,
- schema and scripts,
- deployment configuration,
- CI or at least verification guidance,
- README with exact operational steps,
- documentation aligned with actual implementation.
