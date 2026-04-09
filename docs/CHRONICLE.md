# CHRONICLE

## 2026-04-09 — Baseline governance pack created
- Branch: `integration/test-assignment-retailcrm-dashboard` (suggested)
- Scope: created the full specification and repository governance baseline for Codex-driven execution.
- Key artifacts:
  - `AGENTS.md`
  - `README.md`
  - `docs/PROJECT_CONTEXT.md`
  - `docs/SPEC.md`
  - `docs/ARCHITECTURE.md`
  - `docs/PLAN.md`
  - `docs/STATE.md`
  - `docs/CHRONICLE.md`
  - `docs/DATA_MODEL.md`
  - `docs/API_CONTRACTS.md`
  - `docs/SECURITY_MODEL.md`
  - `docs/DEPLOYMENT.md`
  - `docs/TEST_STRATEGY.md`
  - `docs/ADR/*`
- Rationale: establish a spec-first execution pack so Codex works under explicit constraints instead of generating ad hoc architecture.
- Verification: manual consistency review of document set and repository structure.
- Next: scaffold the actual application and repository tooling.

## 2026-04-09 — M1 scaffold implemented
- Branch: `task/scaffold` from `feat/next-stage-baseline`
- Scope: initialized git, committed the baseline snapshot, and implemented the Next.js + TypeScript repository scaffold for the first delivery milestone.
- Key artifacts:
  - `package.json`
  - `package-lock.json`
  - `next.config.ts`
  - `tsconfig.json`
  - `eslint.config.mjs`
  - `vitest.config.ts`
  - `app/layout.tsx`
  - `app/page.tsx`
  - `app/globals.css`
  - `app/page.module.css`
  - `lib/env.ts`
  - `lib/env.test.ts`
  - `.github/workflows/ci.yml`
  - `scripts/check-docs.sh`
- Verification:
  - `npm run docs:golden`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
- Risks / next:
  - Supabase schema and clients are not implemented yet
  - External service credentials and API specifics remain pending for M2/M3

## 2026-04-09 — M2 data model and security foundation
- Branch: `task/data-model` from `feat/next-stage-baseline`
- Scope: added the baseline Supabase schema and explicit client helpers that separate public read access from service-role access.
- Key artifacts:
  - `supabase/schema.sql`
  - `lib/supabase.ts`
  - `lib/supabase.test.ts`
  - `package.json`
  - `package-lock.json`
  - `docs/STATE.md`
  - `docs/SECURITY_MODEL.md`
  - `docs/DATA_MODEL.md`
- Verification:
  - `npm run docs:golden`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
- Risks / next:
  - RetailCRM import adapter and payload mapping are still pending
  - External credentials remain required for end-to-end integration checks

## 2026-04-09 — M3 RetailCRM import foundation
- Branch: `task/retailcrm-import` from `feat/next-stage-baseline`
- Scope: implemented deterministic fixture-to-RetailCRM mapping, official batch upload request construction, site resolution, and the import CLI entrypoint.
- Key artifacts:
  - `lib/retailcrm.ts`
  - `lib/retailcrm.test.ts`
  - `scripts/import-retailcrm.ts`
  - `.env.example`
  - `docs/API_CONTRACTS.md`
  - `docs/STATE.md`
- Verification:
  - `npm run test -- lib/retailcrm.test.ts`
  - live RetailCRM import not executed yet because credentials are unavailable
- Risks / next:
  - import path still needs live verification against a real RetailCRM account
  - M4 sync should start only after the import path is confirmed
