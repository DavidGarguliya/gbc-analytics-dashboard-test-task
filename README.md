# RetailCRM Mini Dashboard — Codex Delivery Pack

This repository is prepared as a **spec-first, production-shaped implementation** for the AI Tools Specialist test assignment.

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
This repository now contains:
- governance documents,
- Next.js App Router + TypeScript scaffold,
- baseline quality scripts for `docs:golden`, `lint`, `typecheck`, `test`, and `build`,
- CI workflow for repository quality gates,
- initial server-safe environment helper and test coverage,
- baseline Supabase schema and client helpers with explicit public/service-role boundaries,
- RetailCRM import adapter and script foundation.

## Suggested branch model
- `main`
- `feat/next-stage-baseline`
- `task/*` branches per milestone

## Local setup
```bash
npm install
npm run docs:golden
npm run lint
npm run typecheck
npm run test
npm run build
```

```bash
# Requires valid RetailCRM credentials in the environment
npm run import:retailcrm
```

## Suggested execution sequence
1. Spec foundation review
2. Implement schema
3. Implement RetailCRM import
4. Implement sync engine
5. Implement dashboard
6. Implement Telegram alerts
7. Add deployment evidence and final README

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
