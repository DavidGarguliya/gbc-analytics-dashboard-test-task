# PLAN

## Execution model
Work in small milestones. Each milestone closes only when:
- code is coherent,
- verification was performed,
- `docs/STATE.md` is updated,
- `docs/CHRONICLE.md` is updated,
- related docs are synchronized.

## Milestones

### M0 — Spec foundation
Goal:
- establish the governing documentation and repository rules.

Outputs:
- AGENTS
- PROJECT_CONTEXT
- SPEC
- ARCHITECTURE
- PLAN
- STATE
- CHRONICLE
- ADRs
- README baseline

Done when:
- all governance documents exist and are internally consistent.

### M1 — Repository scaffold
Goal:
- create the implementation scaffold.

Outputs:
- Next.js + TypeScript setup
- baseline package scripts
- folder structure
- basic CI workflow(s)
- environment variable template

Done when:
- project installs,
- lint/typecheck/build commands exist,
- structure aligns with docs.

### M2 — Data model and security foundation
Goal:
- define and implement storage schema and environment boundaries.

Outputs:
- `supabase/schema.sql`
- Supabase client helper(s)
- data model docs aligned to schema
- security model refined against actual implementation

Done when:
- schema creates required tables,
- uniqueness and dedupe semantics are explicit.

### M3 — RetailCRM import
Goal:
- import `mock_orders.json` into RetailCRM.

Outputs:
- import script
- RetailCRM adapter
- operator instructions for import

Done when:
- script can upload input data to RetailCRM and report result clearly.

### M3.1 — Live Contract Reconciliation
Goal:
- reconcile the documented import contract with the actual live RetailCRM account before any sync work.

Outputs:
- factual live-account behavior documented
- contract mismatch analysis
- contract-of-record note or ADR
- minimal import-path alignment only if required to match live account defaults safely

Done when:
- downstream phases know which live RetailCRM values are authoritative,
- repeated import behavior is documented explicitly,
- alert threshold semantics are explicit,
- M4 can start against one stable contract of record when approved.

### M4 — RetailCRM -> Supabase sync
Goal:
- move order data from RetailCRM into Supabase safely.

Outputs:
- sync script or server-side trigger
- cursor/state handling
- upsert logic
- tests for risky mapping or dedupe logic if practical

Done when:
- repeated sync is safe,
- Supabase contains orders,
- logs are clear.

### M5 — Dashboard
Goal:
- display usable order metrics from Supabase.

Outputs:
- dashboard page
- summary metrics
- orders-by-day chart
- recent orders list

Done when:
- dashboard renders live data locally.

### M6 — Telegram alerts
Goal:
- notify about high-value orders.

Outputs:
- Telegram adapter
- alert checker path
- persistence of sent alerts

Done when:
- order above threshold produces one readable notification,
- repeat runs do not create duplicates.

### M7 — End-to-end pipeline runner
Goal:
- provide one executable local runner that drives the already-validated chain in order.

Outputs:
- one-command pipeline entrypoint
- macOS launcher wrapper
- Windows launcher wrapper
- final execution summary output
- README/operator instructions for end-to-end local execution

Done when:
- one launch runs import, sync, dashboard read, and alerts in order,
- rerun behavior is operationally safe,
- summary output is honest,
- wrappers are present and documented.

### M8 — Deployment and handoff
Goal:
- complete Vercel deployment and finalize reviewer-facing handoff material.

Outputs:
- working Vercel dashboard deployment
- final README with setup, deployment, prompts, blockers, and limitations
- final deployment and run instructions
- final evidence inventory and handoff checklist
- final verification pass

Done when:
- dashboard is reachable on Vercel,
- deployed reads stay aligned with Supabase,
- repository is reviewable without oral explanation,
- final evidence list is complete.

---

## Branch guidance by milestone
- `task/spec-foundation` -> M0
- `task/scaffold` -> M1
- `task/data-model` -> M2
- `task/retailcrm-import` -> M3
- `task/m3-contract-reconciliation` -> M3.1
- `task/sync-engine` -> M4
- `task/dashboard` -> M5
- `task/telegram-alerts` -> M6
- `task/deployment-readme` -> M7
- `task/final-hardening` -> M8

---

## Closeout checklist per milestone
Each milestone closeout should record:
- scope delivered,
- files created or changed,
- verification performed,
- known risks,
- next milestone.

---

## Ready/Not Ready rules

### A milestone is ready to begin when
- prior milestone artifacts needed for it exist,
- `docs/STATE.md` identifies it as next or active,
- no unresolved architectural blocker remains.

### A milestone is not ready to close when
- docs are stale,
- verification is missing,
- implementation contradicts invariants,
- unresolved blockers are hidden instead of recorded.
