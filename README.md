# RetailCRM -> Supabase -> Dashboard Delivery

Compact, production-shaped delivery for the AI Tools Specialist test assignment:

- import 50 fixture orders from `mock_orders.json` into RetailCRM
- sync RetailCRM orders into Supabase
- render the dashboard from Supabase only
- send server-side Telegram alerts for stored orders above `50,000 KZT`
- deploy the dashboard to Vercel

## Architecture Overview

```text
mock_orders.json
  -> import script
  -> RetailCRM
  -> sync script
  -> Supabase (orders, sync_state, alerts_sent)
  -> Next.js dashboard on Vercel

Supabase
  -> Telegram alert runner
```

Current live contract:
- RetailCRM is the upstream order source
- Supabase is the only dashboard and alert read source
- stored currency semantics are `KZT`
- alert threshold semantics are `total_sum > 50,000` with no currency conversion
- alert deduplication is explicit in `alerts_sent`

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Postgres via `@supabase/supabase-js`
- RetailCRM HTTP API
- Telegram Bot API
- Vercel for dashboard hosting

## Repository Structure

- `app/` - Next.js dashboard UI
- `lib/` - thin adapters and server-side helpers
- `scripts/` - import, sync, alert, and local pipeline entrypoints
- `supabase/schema.sql` - authoritative baseline schema
- `docs/` - governing docs, ADRs, state, and milestone history

## Deployment Shape

Accepted deployment pattern: deploy the dashboard to Vercel and keep import, sync, alerting, and the end-to-end pipeline as server-side operator commands run locally.

Why this shape:
- it preserves the accepted server/client boundary
- it avoids exposing RetailCRM or Telegram operations on the public web
- it matches the compact assignment scope without adding admin routes or scheduling

## Prerequisites

- Node.js `>=20.9.0`
- npm `>=10.0.0`
- a Supabase project with [`supabase/schema.sql`](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/supabase/schema.sql) applied before first sync or deployment verification
- RetailCRM API credentials for local import and sync
- Telegram bot token and chat id for local alert runs
- a Vercel account for dashboard deployment

## Environment Variables

### Local full pipeline

Copy `.env.example` to `.env.local` and set:

| Variable | Required for | Notes |
| --- | --- | --- |
| `RETAILCRM_BASE_URL` | local import, sync, pipeline | server-side only |
| `RETAILCRM_API_KEY` | local import, sync, pipeline | server-side only |
| `RETAILCRM_SITE_CODE` | optional local import, sync | pins a specific site |
| `SUPABASE_URL` | dashboard server read, sync, alerts, pipeline | same project as the applied schema |
| `SUPABASE_SERVICE_ROLE_KEY` | dashboard server read, sync, alerts, pipeline | server-side only |
| `SUPABASE_ANON_KEY` | optional future browser-safe parity | not used by the current server-rendered dashboard |
| `NEXT_PUBLIC_SUPABASE_URL` | optional future browser-safe parity | not used by the current server-rendered dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional future browser-safe parity | not used by the current server-rendered dashboard |
| `TELEGRAM_BOT_TOKEN` | local alerts, pipeline | server-side only |
| `TELEGRAM_CHAT_ID` | local alerts, pipeline | server-side only |
| `NEXT_PUBLIC_APP_URL` | optional public app URL | useful for documentation and later public route generation |

### Vercel dashboard-only deployment

For the current dashboard-only deployment, required runtime env is:

| Variable | Required on Vercel | Why |
| --- | --- | --- |
| `SUPABASE_URL` | yes | server-side dashboard read path |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | server-side dashboard read path |

Optional on Vercel for future browser-safe parity or public URL bookkeeping:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

Not required on Vercel for the accepted deployment shape:
- `RETAILCRM_BASE_URL`
- `RETAILCRM_API_KEY`
- `RETAILCRM_SITE_CODE`
- `SUPABASE_ANON_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Prepare local env

```bash
cp .env.example .env.local
```

Fill `.env.local` with the local pipeline values listed above.

### 3. Apply Supabase schema

Apply [`supabase/schema.sql`](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/supabase/schema.sql) to the target Supabase project before the first live sync or dashboard verification. This creates:

- `orders`
- `sync_state`
- `alerts_sent`

### 4. Run the quality gates

```bash
npm run docs:golden
npm run lint
npm run typecheck
npm run test
npm run build
```

## Local Operator Commands

Import fixture orders into RetailCRM:

```bash
npm run import:retailcrm
```

Sync RetailCRM into Supabase:

```bash
npm run sync:retailcrm
```

Send high-value Telegram alerts:

```bash
npm run alerts:telegram
```

## One-Command Local Pipeline

Run the whole chain in order:

```bash
npm run pipeline
```

Wrapper launchers:
- macOS: `./scripts/run-pipeline.command`
- Windows: `scripts\\run-pipeline.cmd`

Observed rerun behavior:
- import may report `Uploaded orders: 0` with a duplicate-safe `externalId` rejection
- sync remains upsert-based and rerun-safe
- dashboard read remains Supabase-backed
- alerts remain deduplicated and can honestly report `Pending alerts found: 0`

## Vercel Deployment

Chosen approach: dashboard-only deployment.

### 1. Authenticate and link the project

```bash
vercel login
vercel link
```

If GitHub SSO or browser-based login is preferred:

```bash
vercel login --github --oob
```

### 2. Configure Vercel environment variables

Set the dashboard-only Vercel env set:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

### 3. Deploy

```bash
vercel deploy --prod
```

### 4. Verify the deployed dashboard

Verify:
- the homepage loads
- metrics render from Supabase
- recent orders render from Supabase
- no RetailCRM or Telegram secret is exposed client-side
- runtime succeeds with server-side Supabase env only

## Verification Commands

Required repository gates:

```bash
npm run docs:golden
npm run lint
npm run typecheck
npm run test
npm run build
```

Optional local production smoke check:

```bash
npm run start -- --hostname 127.0.0.1 --port 4010
curl http://127.0.0.1:4010
```

## Prompts Used With Codex

The implementation was driven milestone-by-milestone with explicit scope constraints rather than one open-ended prompt. The key working prompts were:

1. Build the RetailCRM import foundation for `mock_orders.json`, keep it deterministic, and stop after a real live import checkpoint.
2. Reconcile the observed live RetailCRM contract before any downstream work, then align downstream semantics to the live account rather than fixture intent.
3. Implement the RetailCRM -> Supabase sync path with explicit sync state and safe reruns.
4. Implement the dashboard against Supabase as the only read source with no UI-side currency reinterpretation.
5. Re-open the currency contract, correct the upstream account to `KZT`, resync Supabase, and keep the dashboard faithful to stored data.
6. Implement Telegram alerting for stored orders above `50,000 KZT`, deduplicate explicitly, and keep it server-side only.
7. Create one executable local pipeline runner for import -> sync -> dashboard read -> alerts with honest rerun reporting.
8. Finalize Vercel deployment, reviewer-facing README quality, and the final handoff evidence inventory without adding product scope.

## Where Implementation Got Stuck

| Blocker | Where it appeared | Resolution |
| --- | --- | --- |
| RetailCRM reference endpoints returned object-shaped payloads instead of the assumed array shape | M3 live import | normalized the adapter to accept the live payload shape |
| The live RetailCRM account exposed only one supported order type, `main` | M3 live import | added deterministic order-type reconciliation in the import mapping |
| The initial live RetailCRM account persisted imported demo orders as `RUB` instead of `KZT` | post-M5 contract review | corrected the upstream account first, then reran sync so Supabase and the dashboard stayed truthful |
| Telegram delivery was blocked because `TELEGRAM_CHAT_ID` was not yet configured | M6 live verification | derived the chat id from the bot updates flow after the user sent a bot message |
| The pipeline script could not import the Next.js `server-only` dashboard module | M7 implementation | split the reusable Supabase read path into `lib/dashboard-read.ts` and kept the App Router wrapper thin |
| `npm run pipeline` originally did not load `.env.local` automatically | M7 live verification | switched the script to Node's `--env-file=.env.local` entrypoint |

## Known Limitations

- The accepted deployment shape hosts the dashboard only. Import, sync, alerts, and the full pipeline remain local operator commands.
- The current deployed dashboard is server-rendered from Supabase and does not consume the browser-safe Supabase env vars today.
- The alert runner uses send-then-mark semantics. A crash after successful send and before the `alerts_sent` write can resend that single order on a later rerun.
- The import path is a seed import. On rerun, duplicate `externalId` rejection is treated as an accepted safe outcome rather than an update path.
- The Windows launcher exists and is documented, but only the macOS launcher was live-verified in this repository session.
- Final submission evidence still requires attaching the Telegram screenshot artifact generated from the accepted live alert run.

## Final Handoff Checklist

- [x] Vercel dashboard URL recorded
- [ ] GitHub repository URL recorded
- [ ] Telegram screenshot attached
- [x] Supabase schema requirement documented
- [x] local env requirements documented
- [x] Vercel env requirements documented
- [x] local pipeline instructions documented
- [x] blockers and resolutions documented
- [x] known limitations documented

## Evidence Inventory

- Vercel URL: `https://gbc-analytics-dashboard-test-task.vercel.app`
- GitHub repo URL: record the repository URL from the configured remote used for submission
- Telegram screenshot: attach the screenshot from the accepted M6 live alert verification
- Submission-ready summary: this repository implements the full assignment chain `mock_orders.json -> RetailCRM -> Supabase -> Dashboard -> Telegram alerts -> Vercel`, with the accepted live contract of `KZT`, alert semantics of `total_sum > 50,000 KZT`, explicit alert dedupe in `alerts_sent`, and a one-command local pipeline runner for repeatable operator execution
