# RetailCRM Mini Dashboard — Codex Delivery Pack

This repository is prepared as a **spec-first, production-shaped implementation** for the AI Tools Specialist test assignment.

Target delivery:
- import test orders from `mock_orders.json` into RetailCRM,
- sync RetailCRM orders into Supabase,
- render a dashboard from Supabase data,
- send Telegram alerts for high-value orders (> 50,000 using the live RetailCRM currency of record; the current demo account now returns imported orders in `KZT`),
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
- RetailCRM import adapter and script foundation,
- RetailCRM -> Supabase sync foundation with explicit state handling,
- Supabase-backed dashboard read model and UI,
- server-side Telegram alert foundation with explicit dedupe in `alerts_sent`.

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

```bash
# Requires valid RetailCRM + Supabase service-role credentials in the environment
npm run sync:retailcrm
```

```bash
# Requires valid Supabase service-role credentials plus TELEGRAM_BOT_TOKEN and a non-empty TELEGRAM_CHAT_ID
npm run alerts:telegram
```

```bash
# Runs the full local chain in order: import -> sync -> dashboard read -> Telegram alerts -> final summary
# This local command auto-loads .env.local via Node's --env-file support.
npm run pipeline
```

Wrapper launchers:
- macOS: `./scripts/run-pipeline.command`
- Windows: `scripts\\run-pipeline.cmd`

Observed rerun behavior:
- the seed import may return `Uploaded orders: 0` with a `duplicate-safe externalId rejection`
- sync still upserts the live RetailCRM rows into Supabase safely
- dashboard read still reports the current Supabase-backed metrics
- Telegram alerts remain deduplicated and may legitimately report `Pending alerts found: 0`

## Suggested execution sequence
1. Spec foundation review
2. Implement schema
3. Implement RetailCRM import
4. Implement sync engine
5. Implement dashboard
6. Implement Telegram alerts
7. Add the end-to-end pipeline runner
8. Add deployment evidence and final README

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
- Telegram execution stays server-side and fails loudly if `TELEGRAM_CHAT_ID` is not configured
- `npm run pipeline` treats the known RetailCRM duplicate-`externalId` seed-import rejection as an operationally safe rerun outcome and continues honestly with `uploaded=0`
- No overengineering
- Docs must match implementation
