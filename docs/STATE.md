# STATE

## Current state
Status: M2 is closed. M3 is sufficiently validated for the test assignment after M3.1 live contract reconciliation. M4 is closed and live-verified. M5 dashboard read model and UI are implemented against Supabase as the only read source. After a post-M5 upstream currency realignment, the live RetailCRM contract of record now returns `KZT`, Supabase has been resynced, and the dashboard renders the current synced data set in `KZT` without any client-side relabeling or currency conversion. M6 Telegram alert foundation is closed and live-verified against that KZT contract, with explicit dedupe in `alerts_sent`. M7 end-to-end pipeline runner is closed and live-verified as a one-command local chain over the existing foundations. M8 deployment and handoff is complete: the dashboard is deployed and reachable on Vercel at `https://gbc-analytics-dashboard-test-task.vercel.app`, the repository is published at `https://github.com/DavidGarguliya/gbc-analytics-dashboard-test-task`, and the Vercel project is linked to that GitHub repository with `main` as the production branch. On the current local slice branch, the source analytics refinement is now extended without any schema change or read-path expansion: `marketingSource` is still derived only from persisted `raw_json.customFields.utm_source`, `orderMethod` is still derived only from persisted `raw_json.orderMethod`, and the overview block `Источник заказа` now prioritizes per-channel revenue, average order value, high-value order count, revenue share, and comparison-period revenue context while keeping `Способ оформления`, the table, details panel, and Telegram alerts on the same honest split semantics. Local quality gates pass for this slice. Production remains on the last merged `main` commit until this branch is reviewed and integrated. The only remaining external artifact is the accepted Telegram screenshot.

## Active branch
Checkpoint-review branch: `task/source-analytics-controlled-refinement`
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
- M4 sync foundation added with live-order mapping, Supabase upsert helpers, explicit sync-state persistence, and a server-side sync CLI
- M4 live verification completed against the configured Supabase project
- M5 dashboard read model and UI added with Supabase-only server-side reads and honest source labeling
- ADR-005 added to capture the upstream realignment of the live currency contract to `KZT`
- Supabase resynced after the upstream KZT realignment
- M6 alert foundation added with a Telegram Bot API adapter, explicit high-value KZT Supabase reads, durable dedupe writes to `alerts_sent`, and a server-side CLI entrypoint
- M6 live verification completed by deriving the Telegram chat target from bot updates, sending all current qualifying alerts once, and confirming a zero-send rerun
- M7 pipeline runner added with a single local command, macOS and Windows launchers, and live-verified end-to-end execution over import, sync, dashboard read, and alert stages
- M8 Vercel deployment completed and live-verified for the dashboard at `https://gbc-analytics-dashboard-test-task.vercel.app`
- Dashboard rebuilt into a Russian analytical overview with period filters, KPI deltas, compact trends, analytical breakdowns, and a sortable drilldown table
- Overview dashboard visually redesigned into a lighter SaaS-style analytical screen without changing its Supabase-backed business logic
- Order details and Telegram alerts aligned to the same operational field set: number, amount, currency, client, phone, city, source, item composition, positions count, units count, and date
- Shared operational projection updated to read real item names from live RetailCRM nested item payloads instead of falling back to generic placeholders
- Telegram alerts extended to include persisted email under the phone line when available from `raw_json`
- README rewritten in Russian for reviewer-facing delivery quality
- Final UI polish pass completed: pagination added, table columns refined to include client names instead of item counts, and orders-by-day chart colors softened towards the overarching Recharts palette
- Analytics source/model refinement completed locally: dashboard and Telegram now separate marketing attribution (`utm_source`) from operational order method in the projection layer without changing the Supabase schema
- Controlled source analytics refinement completed locally: the marketing-source overview block now surfaces revenue-first channel performance, high-value order counts, revenue share, and comparison-period context without redesigning the dashboard or changing the Supabase-only read path

## In progress
- No active coding tasks. `task/source-analytics-controlled-refinement` is locally verified and pending review before any merge into `feat/next-stage-baseline`.

## Next recommended step
- attach the accepted Telegram screenshot artifact to the submission package
- review and merge `task/source-analytics-controlled-refinement` back into `feat/next-stage-baseline` if the source breakdown is accepted
- redeploy the dashboard if production must reflect the richer `Источник заказа` metrics immediately after that merge
- keep production/deployment Telegram configuration explicit so the pipeline does not depend on ad hoc local chat-id discovery
- preserve the stored Supabase `KZT` contract for any later deployment or handoff work
- avoid reinterpreting currency semantics or reintroducing the mixed `orders.source` field as the authoritative marketing dimension

## Known blockers
- The accepted Telegram screenshot exists as an external submission artifact and is not stored in this repository

## Risks to watch
- overengineering during import adapter setup,
- accidental client exposure of secrets,
- schema drift between docs and implementation,
- sync design becoming ambiguous if cursor strategy is not kept explicit,
- the current sync remains a full-scan pull of one site; if a later phase needs incremental behavior, the explicit cursor contract must be evolved carefully rather than inferred,
- the dashboard currently computes metrics from stored rows in one server-side read path; if order volume grows later, read-model aggregation should evolve explicitly rather than drift into hidden client computation,
- the redesigned detail panel and alert formatter now depend on `customer_name`, `phone`, and `raw_json` payload fragments such as `delivery.address.city` and `items[*]`, so any future payload-shape change must be handled explicitly in the shared operational summary helper rather than separately in UI and alert code,
- the persisted `orders.source` column remains historically mixed by sync design, so later analytics code must keep using the explicit raw-json-derived `marketingSource` and `orderMethod` projection instead of reusing that stored field directly,
- deployment and operator environments still need a configured `TELEGRAM_CHAT_ID` instead of relying on chat-id discovery during ad hoc live verification,
- the alert runner currently uses send-then-mark semantics; if a process exits after a successful Telegram send but before the dedupe write, a rerun could resend that specific order.
- the Vercel project currently contains optional browser-safe env placeholders that are not used by the current server-rendered dashboard, so future client-side Supabase usage must be introduced deliberately rather than assumed from deployment state

## Definition of health at this stage
Healthy if:
- docs are internally consistent,
- import, sync, dashboard, and alert code pass local quality gates,
- the live account contract of record is documented factually,
- the sync path stays server-side only and preserves live RetailCRM values without reinterpretation,
- the configured Supabase project contains 50 synced orders and one explicit `retailcrm_orders_sync` state row after a rerun-safe live verification,
- the dashboard renders those Supabase rows with metrics matching the current synced data set: 50 orders, `2,451,000 KZT` total revenue, `49,020 KZT` average order value,
- the alert path has been live-verified to send all current qualifying `KZT` orders once and to send zero duplicates on immediate rerun,
- the local analytics-refinement branch keeps the same Supabase-only dashboard read path and the same `KZT` high-value alert threshold while separating `marketingSource` from `orderMethod` strictly through already persisted fields plus stored `raw_json`,
- the pipeline runner has been live-verified through both `npm run pipeline` and the macOS launcher, with an honest rerun summary of import `uploaded=0`, sync `50/50`, dashboard `50` orders, and alerts `0/0`,
- the promoted Vercel dashboard URL returns HTTP `200` for the last merged slice, and the current local analytics-refinement branch builds successfully with the separated overview markers `Источник заказа` and `Способ оформления`,
- the Vercel project is linked to GitHub repository `DavidGarguliya/gbc-analytics-dashboard-test-task` with `main` as the production branch.

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
  - recorded that the original live checkpoint stored imported orders with `currency = RUB`
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

### M4 — RetailCRM -> Supabase sync foundation
- Planned scope:
  - implement a compact RetailCRM-to-Supabase sync path against the reconciled live contract
  - persist enough fields for dashboard and later alerting
  - make repeated sync safe
  - track sync state explicitly
- Implemented scope:
  - added paginated RetailCRM order-list helper for sync usage
  - added deterministic mapping from live RetailCRM order records into the `orders` table shape
  - added Supabase `orders` upsert helper keyed by `retailcrm_id`
  - added Supabase `sync_state` read/write helpers keyed by `retailcrm_orders_sync`
  - added server-side CLI entrypoint `npm run sync:retailcrm`
  - live-verified the configured Supabase project by applying the baseline schema, running the sync, rerunning it immediately, and confirming that `orders` remains at 50 unique rows while `sync_state` advances
  - the configured Supabase project required baseline schema bootstrap before the first live sync; no fresh project should be assumed ready without applying `supabase/schema.sql`
- Intentionally deferred scope:
  - no Telegram implementation
  - no dashboard expansion during M4
  - no currency conversion or reinterpretation of live RetailCRM semantics
- Verified invariants:
  - sync path remains server-side only
  - repeated sync is safe by construction because persistence upserts on unique `retailcrm_id`
  - live RetailCRM fields such as `currency`, `status`, `site`, `orderType`, and `totalSumm` are consumed from the returned upstream record, not from fixture intent
  - sync state is explicit and durable
- Remaining unknowns:
  - none that block M5 under the current single-site, full-scan contract

### M5 — Dashboard read model and UI
- Planned scope:
  - render the dashboard from Supabase as the only read source
  - show core metrics, a daily orders chart, and a latest-orders table
  - keep UI semantics honest with the stored live contract
- Implemented scope:
  - added a pure dashboard read-model builder for totals, average order value, daily counts, and latest orders
  - added a server-only Supabase loader that reads the `orders` table and feeds the dashboard page
  - replaced the scaffold placeholder page with a live dashboard UI
  - labeled the attribution column as `Source / Method` to avoid overstating source precision where the stored field mixes upstream source and order-method fallback
- Intentionally deferred scope:
  - no Telegram implementation
  - no dashboard-side currency conversion
  - no business inference beyond stored Supabase fields
- Verified invariants:
  - dashboard reads Supabase only
  - browser code does not call RetailCRM directly
  - displayed monetary values use stored live currency as-is
  - current metrics match the live synced Supabase data set
- Remaining unknowns:
  - none that block M6 under the current dashboard contract

### Post-M5 — Currency contract realignment
- Planned scope:
  - realign the live RetailCRM account to `KZT` upstream first
  - propagate the corrected upstream currency through Supabase and the dashboard
  - update contract docs so current repository truth stops claiming `RUB`
- Implemented scope:
  - edited the live RetailCRM base currency from `RUB` to `KZT`
  - verified that the accessible site and the existing imported demo orders now return `KZT`
  - reran RetailCRM -> Supabase sync so persisted rows reflect the corrected live contract
  - verified that the dashboard now renders `KZT` values from Supabase without any UI-side patching
  - added ADR-005 to supersede ADR-004 specifically for current currency semantics
- Verified invariants:
  - upstream source remained authoritative
  - no client-side currency override was introduced
  - the dashboard still reads Supabase only
  - sync remained the only propagation path from RetailCRM to Supabase
- Remaining unknowns:
  - none that block M6 under the corrected KZT contract

### M6 — Telegram alert foundation
- Planned scope:
  - detect stored `KZT` orders above the fixed `50,000` threshold
  - send Telegram notifications server-side only
  - deduplicate notifications explicitly through `alerts_sent`
  - keep the operator path simple and auditable
- Implemented scope:
  - added a thin Telegram Bot API adapter with explicit message formatting and fail-loud HTTP handling
  - added Supabase helpers to read unalerted high-value `KZT` orders and upsert `alerts_sent` dedupe markers
  - added a compact alert runner that sends messages sequentially and records dedupe immediately after each successful send
  - added the server-side CLI entrypoint `npm run alerts:telegram`
- Intentionally deferred scope:
  - no dashboard changes during M6
  - no currency conversion logic
  - no non-KZT fallback semantics
- Verified invariants:
  - Telegram secrets remain server-side only
  - alert evaluation uses stored Supabase rows rather than direct RetailCRM reads
  - dedupe state stays explicit and durable in `alerts_sent`
  - rerun behavior is verified both by tests and by live rerun against the configured Supabase project
- Remaining unknowns:
  - deployment/runtime environments still need an explicit `TELEGRAM_CHAT_ID` configuration

### M7 — End-to-end pipeline runner
- Planned scope:
  - create one executable local entrypoint that runs import, sync, dashboard read, and alert stages in order
  - add macOS and Windows launchers
  - keep orchestration thin and reuse the validated foundations
- Implemented scope:
  - added a pure pipeline orchestration module with fail-fast behavior and final summary reporting
  - exported reusable run/log helpers from the import, sync, and alert scripts
  - added `npm run pipeline`, `scripts/run-pipeline.ts`, `scripts/run-pipeline.command`, and `scripts/run-pipeline.cmd`
  - split the dashboard read query into a plain server module so the pipeline can reuse it outside Next's `server-only` boundary
  - updated README and script docs with exact launch steps and rerun expectations
- Verified invariants:
  - orchestration introduced no new business logic beyond sequencing and summary reporting
  - secrets remain server-side only
  - the pipeline reads dashboard data from Supabase only
  - the pipeline treats the accepted duplicate seed-import rejection as an operationally safe rerun outcome and reports it honestly
  - the macOS launcher executes the same pipeline command successfully
- Remaining unknowns:
  - Windows launcher presence is documented, but not executed in this macOS environment
### M8 — Recharts visual redesign
- Planned scope:
  - Migrate dashboard charts from custom SVGs to a professional charting library (Recharts)
  - Ensure animations, tooltips, and responsive scaling are present
  - Elevate visual design to premium SaaS aesthetics
  - Maintain the Supabase-only read path and data boundaries
- Implemented scope:
  - Installed `recharts` and created `ADR-006` to document its usage as the primary client-side library.
  - Replaced `RevenueTrendChart` with `recharts` `AreaChart` and implemented custom UI tooltips and SVG gradient definitions.
  - Replaced `OrdersTrendChart` with `recharts` `BarChart` and implemented precise rounded bars and interactive cursors.
  - Aligned the visual system with the modernized order details panel, focusing on high-contrast colors and subtle typography.
  - Dropped custom styling logic for lines and bars from `page.module.css` and moved them inline to Recharts configuration.
- Verified invariants:
  - `npm run dev` and `npm run build` confirm compatibility with Server/Client boundary (via `"use client"` proxy wrapper).
  - No new data fetch requests were introduced.
  - TypeScript types correctly aligned for `recharts` formatter payload.
- Remaining unknowns:
  - Ready for final Vercel deployment upon merge.
