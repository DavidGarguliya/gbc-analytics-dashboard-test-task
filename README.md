# RetailCRM Mini Dashboard — Codex Delivery Pack

This repository is prepared as a **spec-first, implementation-ready baseline** for the AI Tools Specialist test assignment.

Target delivery:
- import test orders from `mock_orders.json` into RetailCRM,
- sync RetailCRM orders into Supabase,
- render a dashboard from Supabase data,
- send Telegram alerts for high-value orders (> 50,000 KZT),
- deploy the dashboard to Vercel,
- document the full process, prompts, blockers, and resolutions.

## Operating mode
This repository is governed by `AGENTS.md` and the documents in `docs/`.

Before any implementation work:
1. Read `docs/STATE.md`
2. Read `docs/PLAN.md`
3. Read `docs/PROJECT_CONTEXT.md`
4. Read `docs/SPEC.md`
5. Read `docs/ARCHITECTURE.md`
6. Read `docs/SECURITY_MODEL.md`
7. Read `docs/DATA_MODEL.md`
8. Read relevant ADRs

## Current repository status
This pack contains:
- governance documents,
- architecture and data model,
- execution plan,
- deployment and test strategy,
- repository conventions,
- placeholders for `app/`, `lib/`, `scripts/`, `supabase/`.

It does **not** yet contain the final application code. It is intended to be dropped into a clean repository and used as the authoritative baseline for Codex execution.

## Suggested branch model
- `main`
- `integration/test-assignment-retailcrm-dashboard`
- `task/*` branches per milestone

## Suggested execution sequence
1. Spec foundation review
2. Scaffold app
3. Implement schema
4. Implement RetailCRM import
5. Implement sync engine
6. Implement dashboard
7. Implement Telegram alerts
8. Add CI, hardening, and final README evidence

## Deliverables expected at the end
- Vercel URL
- GitHub repository URL
- Telegram alert screenshot
- README with prompts, blockers, and resolutions

## Key constraints
- Secrets never in client code
- Dashboard reads from Supabase only
- Sync must be idempotent
- Alerts must be deduplicated
- No overengineering
- Docs must match implementation
