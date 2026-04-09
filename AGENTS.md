# AGENTS.md

## Mission
Build and maintain a compact, production-shaped delivery for the test assignment:

`mock_orders.json -> RetailCRM -> Supabase -> Dashboard -> Telegram alerts -> Vercel`

Primary quality goals, in order:
1. Correctness
2. Security
3. Deterministic and idempotent integrations
4. Scalability without overengineering
5. Documentation that matches reality
6. Clean git history

This repository is operated in **spec-first mode**. Do not begin or continue implementation blindly. Read the governing documents, align the change with the current state, implement the smallest coherent slice, then close it out.

---

## Required reading order before any non-trivial change
Read in this exact order:

1. `docs/STATE.md` — current state, active branch, next task, blockers.
2. `docs/PLAN.md` — milestone sequence, acceptance criteria, closeout expectations.
3. `docs/PROJECT_CONTEXT.md` — project goal, scope, non-goals, delivery expectations.
4. `docs/SPEC.md` — functional and non-functional requirements.
5. `docs/ARCHITECTURE.md` — system shape, component boundaries, data flow.
6. `docs/SECURITY_MODEL.md` — secret boundaries, client/server separation, integration constraints.
7. `docs/DATA_MODEL.md` — storage schema, uniqueness rules, dedupe rules.
8. Relevant ADRs in `docs/ADR/`.
9. `README.md` — repository-level usage and operator instructions.

If code already exists, then also read, in this order:
10. `package.json`
11. `supabase/schema.sql`
12. `lib/*` relevant adapters
13. `scripts/*` relevant scripts
14. `app/*` relevant routes/pages/components

Do not rely on assumptions if a governing document exists.

---

## Operating mode
For each meaningful task, follow this loop:

1. **Context sync**
   - Read the required governing documents.
   - Check whether the task is already planned, partially completed, or blocked.

2. **Constraint check**
   - Confirm the task does not violate system invariants.
   - If it does, stop and update docs/ADR first.

3. **Smallest coherent implementation**
   - Implement the smallest slice that is complete, testable, and reviewable.
   - Prefer direct code over framework ceremony.

4. **Verification**
   - Run lint.
   - Run typecheck.
   - Run tests relevant to the change.
   - Perform a fast sanity review for secrets, dead code, accidental client exposure, and drift from docs.

5. **Documentation sync**
   - Update `docs/STATE.md`.
   - Update `docs/CHRONICLE.md`.
   - Update any affected design doc or ADR.
   - Update `README.md` if operator workflow changed.

6. **Atomic commit**
   - Commit one concern at a time.
   - Use repository commit conventions.

---

## Hard constraints
These are non-negotiable unless a new ADR explicitly changes them.

### Security
- Never expose RetailCRM, Supabase service-role, or Telegram bot secrets to client-side code.
- Browser code must never call RetailCRM directly.
- Browser code must never call Telegram directly.
- Secrets belong in environment variables only.
- Never commit real secrets, tokens, webhook URLs, or private keys.

### Source of truth and flow
- RetailCRM is the upstream order source.
- Supabase is the dashboard read source.
- Dashboard must read from Supabase, not RetailCRM.
- Telegram alerting must be server-side only.

### Data correctness
- RetailCRM -> Supabase sync must be idempotent.
- Re-running import or sync must not create unbounded duplicates.
- Alerting must be deduplicated by order identity.
- Preserve raw upstream payload for traceability when feasible.

### Architecture
- Do not introduce ORM, repository pattern, service locators, CQRS, queues, or event buses unless explicitly required by a documented decision.
- Do not create abstraction layers for a single implementation with no demonstrated need.
- Keep file/folder depth shallow.
- Prefer simple SQL, thin adapters, and explicit transformations.

### Delivery discipline
- No placeholder TODO architecture.
- No fake data once integration slice is active.
- No “temporary” client-side shortcut that bypasses server boundaries.
- No docs drift: implementation and docs must match.

---

## Branch model
Default branch layout:

- `main` — stable, reviewable delivery branch.
- `integration/test-assignment-retailcrm-dashboard` — integration branch.
- Task branches created from integration:
  - `task/spec-foundation`
  - `task/scaffold`
  - `task/data-model`
  - `task/retailcrm-import`
  - `task/sync-engine`
  - `task/dashboard`
  - `task/telegram-alerts`
  - `task/deployment-readme`
  - `task/final-hardening`

### Branch rules
- Never implement substantial changes directly on `main`.
- Work from task branch -> merge into integration -> merge integration into main.
- Keep task branches focused on one slice.
- Rebase or merge from integration as needed; keep conflicts minimal.

---

## Commit rules
Atomic commits only. One concern per commit.

Commit message format examples:
- `docs(spec): define project scope and invariants`
- `chore(scaffold): initialize nextjs typescript repository`
- `feat(import): add retailcrm batch upload script`
- `feat(sync): add idempotent retailcrm to supabase sync`
- `feat(ui): add dashboard metrics and orders-by-day chart`
- `feat(alerts): add telegram high-value order notifier`
- `docs(readme): document setup prompts and troubleshooting`
- `test(sync): cover upsert and dedupe behavior`
- `chore(ci): add lint typecheck and test workflow`

### Commit quality bar
A commit is acceptable only if it is:
- coherent,
- reviewable,
- reversible,
- documented if behavior/architecture changed.

---

## Documentation obligations
After every closeout, update the following at minimum:

- `docs/STATE.md`
- `docs/CHRONICLE.md`

Update additionally when relevant:
- `docs/PROJECT_CONTEXT.md` if framing or constraints changed.
- `docs/SPEC.md` if functional scope changed.
- `docs/ARCHITECTURE.md` if component boundaries or flows changed.
- `docs/DATA_MODEL.md` if schema or semantics changed.
- `docs/SECURITY_MODEL.md` if boundaries or risk posture changed.
- ADR in `docs/ADR/` if a lasting architectural decision changed.
- `README.md` if setup, execution, or operator workflow changed.

If a task changed reality and docs were not updated, the task is not closed.

---

## Closeout protocol
Every completed milestone or subtask must leave a short closeout entry in `docs/CHRONICLE.md` and refresh `docs/STATE.md`.

Closeout entry must include:
- date,
- branch,
- scope delivered,
- key files changed,
- verification performed,
- outstanding risks or next step.

`docs/STATE.md` must always answer:
- what is done,
- what is in progress,
- what is next,
- what is blocked,
- what branch is active.

---

## Validation checklist before closing a task
Run or verify all applicable items:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build` for deploy-affecting changes
5. review changed files for:
   - leaked secrets,
   - client/server boundary violations,
   - dead code,
   - untracked schema assumptions,
   - documentation drift.

Do not close the task if verification was skipped without recording why.

---

## Repository structure expectations
Expected top-level layout:

- `app/` — Next.js app router pages and API routes
- `components/` — presentational components only when needed
- `lib/` — thin adapters and shared server/client helpers
- `scripts/` — operational scripts: import, sync, alert checks
- `supabase/` — schema, migrations, SQL helpers if needed
- `docs/` — governing documentation
- `.github/` — CI and PR templates

### Folder responsibilities
- `app/` should not contain direct secrets except server-only route handlers using envs.
- `lib/retailcrm.ts` should encapsulate RetailCRM HTTP access.
- `lib/supabase.ts` should encapsulate Supabase clients and safe usage patterns.
- `lib/telegram.ts` should encapsulate Telegram sending.
- `scripts/` are for operator-triggered or scheduled jobs.
- `supabase/schema.sql` is the authoritative baseline schema unless migrations are introduced.

---

## Implementation preferences
Preferred stack and shape:
- Next.js (App Router) + TypeScript
- Supabase Postgres
- Direct SQL or `supabase-js`
- Minimal charting library or server-side aggregation + lightweight rendering
- Small, explicit files
- Defensive parsing and error reporting for external APIs

### What “scalable without overengineering” means here
Allowed:
- thin adapters,
- small utility modules,
- clear domain naming,
- idempotent data writes,
- explicit sync cursor/state,
- alert dedupe table,
- basic tests for risky logic.

Not allowed by default:
- microservices,
- job queues,
- background worker clusters,
- generic repository/service factories,
- speculative caching layers,
- over-abstracted domain model.

---

## Decision policy
When the spec does not dictate an implementation detail, prefer the option that is:
1. simpler,
2. safer,
3. easier to explain in README,
4. easier to verify locally and on Vercel,
5. less likely to drift from the test assignment.

If a change requires architectural deviation, create or update an ADR before implementing it.

---

## Operator-facing deliverables expected by the end
The final repository should produce or document:
- working dashboard deployed to Vercel,
- working code in GitHub,
- import flow for `mock_orders.json` into RetailCRM,
- sync flow from RetailCRM to Supabase,
- Telegram alert screenshot for order amount > 50,000 KZT,
- README with prompts used, issues encountered, and resolutions.

The implementation must remain compact enough for a reviewer to understand quickly.
