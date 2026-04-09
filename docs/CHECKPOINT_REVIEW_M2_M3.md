# M2 + M3 Checkpoint Review

## Status
- M2 status: closed locally
- M3 status: foundation closed locally, live import still pending
- M4 status: blocked until the live import checkpoint succeeds

## M2 Review Summary

### Planned scope
- Add baseline Supabase schema
- Add explicit public/service-role client helpers
- Align security and data-model docs with the implemented schema

### Implemented scope
- Added [schema.sql](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/supabase/schema.sql) for `orders`, `sync_state`, and `alerts_sent`
- Added [supabase.ts](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/lib/supabase.ts) and [supabase.test.ts](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/lib/supabase.test.ts)
- Added explicit RLS posture: public read-only access on `orders`, no public access on `sync_state` or `alerts_sent`

### Intentionally deferred scope
- Live Supabase verification
- Any sync implementation
- Any dashboard query integration beyond the scaffold

### Verified invariants
- Service-role access is guarded against browser-like runtime
- Public browser config reads only `NEXT_PUBLIC_*` Supabase env vars
- Persistence semantics for dedupe and cursor state remain explicit

### Remaining unknowns
- Live RLS behavior in the real Supabase project
- Whether schema needs adjustment once real RetailCRM payloads are synced

## M3 Review Summary

### Planned scope
- Inspect `mock_orders.json`
- Build the import-side RetailCRM adapter
- Add the CLI import flow
- Make assumptions explicit before any live run

### Implemented scope
- Parsed the fixture and confirmed 50 orders
- Added [retailcrm-import.ts](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/lib/retailcrm-import.ts) for fixture parsing and deterministic order mapping
- Kept [retailcrm.ts](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/lib/retailcrm.ts) focused on RetailCRM transport, site lookup, and upload request construction
- Added [import-retailcrm.ts](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/scripts/import-retailcrm.ts) as the CLI entrypoint

### Intentionally deferred scope
- Live import execution against a real RetailCRM account
- Any sync code
- Any alerting code

### Verified invariants
- Import remains server-side only
- Fixture parsing and mapping are isolated from generic RetailCRM transport
- No app code imports RetailCRM helpers or server-side env readers

### Remaining unknowns
- Whether repeated upload with the same `externalId` updates, rejects, or duplicates in the live RetailCRM account
- Exact shape of live `uploadedOrders` response data across accounts
- Which site codes are visible to the provided API key

## Import Foundation Review

### End-to-end flow
1. `npm run import:retailcrm` runs [import-retailcrm.ts](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/scripts/import-retailcrm.ts)
2. The script reads [mock_orders.json](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/mock_orders.json)
3. [parseMockOrdersFixture](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/lib/retailcrm-import.ts) validates that the fixture is an array and that every record matches the expected shape
4. [buildRetailCrmOrder](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/lib/retailcrm-import.ts) maps each validated fixture record into a RetailCRM upload order
5. [listRetailCrmSites](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/lib/retailcrm.ts) fetches accessible sites for the API key
6. [selectRetailCrmSiteCode](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/lib/retailcrm.ts) resolves the site code from `RETAILCRM_SITE_CODE` or the default/first site
7. [uploadRetailCrmOrders](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/lib/retailcrm.ts) POSTs the orders to RetailCRM using `application/x-www-form-urlencoded`
8. The script logs success counts, resolved site, and fixture path; on failure it logs a clear message and exits non-zero

### `mock_orders.json` mapping
- `firstName` -> `firstName`
- `lastName` -> `lastName`
- `phone` -> `phone`
- `email` -> `email`
- `orderType` -> `orderType`
- `orderMethod` -> `orderMethod`
- `status` -> `status`
- `items[]` -> `items[]` with `productName`, `quantity`, `initialPrice`
- `delivery` -> `delivery`
- `customFields` -> `customFields`
- Added defaults/derived fields:
  - `currency = "KZT"`
  - `createdAt = deterministic timestamp starting at 2026-01-01 09:00:00 UTC and incremented by index`
  - `number = MOCK-0001`, `MOCK-0002`, ...
  - `externalId = mock-order-0001`, `mock-order-0002`, ...

### `externalId` generation
- Generated from the fixture index only: `mock-order-${String(index + 1).padStart(4, "0")}`
- Deterministic because the same fixture in the same order always yields the same `externalId`
- This is the core idempotency anchor for repeated import attempts

### Site/site code determination
- If `RETAILCRM_SITE_CODE` is provided, the code must exist in the fetched site list or the script fails loudly
- If it is absent, the script chooses:
  - the site flagged with `defaultForCrm`, otherwise
  - the first accessible site returned by RetailCRM

### Expected repeated import behavior
- Intended behavior: repeated import with the same fixture should target the same `externalId` values and therefore not create uncontrolled duplicate business objects
- Confirmed locally: deterministic payload generation is stable
- Still unconfirmed until live run: how the конкретный RetailCRM account treats repeated upload of the same `externalId`

### Confirmed by tests
- Valid fixture records are accepted
- Malformed fixture records fail with the exact failing index
- Fixture-to-RetailCRM mapping is deterministic
- Upload body includes `apiKey`, `site`, and serialized `orders`
- Preferred site selection and fallback site selection behave as expected

### Still assumption until live run
- The live RetailCRM account accepts the `orders/upload` path with the current payload shape
- Repeated upload of the same `externalId` is dedupe-safe
- Returned site metadata always includes either a default site or at least one accessible site

## Architecture Boundary Review

### Boundary conclusions
- `lib/retailcrm-import.ts` now owns fixture parsing and deterministic import mapping only
- `lib/retailcrm.ts` now owns RetailCRM transport, site selection, and upload body construction only
- `scripts/import-retailcrm.ts` owns CLI orchestration only
- This keeps the import layer isolated from future sync work: sync can reuse the transport helper without depending on fixture-specific mapping

### Client/server reachability check
- Current search result shows no imports of `@/lib/retailcrm`, `@/lib/retailcrm-import`, or `@/lib/env` inside `app/*`
- Current app shell remains isolated from RetailCRM and server-only env usage

### Remaining boundary risk
- `lib/supabase.ts` still hosts both browser-safe and service-role helpers in one module; this is acceptable at the current scope because no client code imports it yet, but future dashboard work should keep that boundary explicit

## Live-Run Checklist

### Required environment variables for the live import
- `RETAILCRM_BASE_URL`
- `RETAILCRM_API_KEY`

### Optional environment variable
- `RETAILCRM_SITE_CODE`

### Exact command
```bash
npm run import:retailcrm
```

### Success criteria
- Script exits with code `0`
- Log shows:
  - `RetailCRM import completed.`
  - correct fixture path
  - resolved site code
  - `Prepared orders: 50`
  - uploaded orders count consistent with the fixture
- RetailCRM UI/API shows all 50 imported orders
- Re-running with the same fixture does not create uncontrolled duplicates

### Expected failure modes and interpretation
- `Missing required environment variable: ...`
  - local operator setup problem; fix env first
- `RetailCRM did not return any accessible sites for the API key.`
  - API key/site access problem
- `RetailCRM site "<code>" is not available for the API key.`
  - wrong `RETAILCRM_SITE_CODE`
- `mock_orders.json entry N has an invalid shape.`
  - fixture corruption or unexpected format drift
- `RetailCRM request failed.`
  - network/auth/endpoint failure; inspect status/details
- `RetailCRM rejected the orders upload.`
  - payload accepted by transport but rejected semantically by RetailCRM

### Evidence to collect after the live run
- Full terminal log from the import command
- RetailCRM screenshot or export showing 50 imported orders
- If a repeat run is attempted, evidence showing whether duplicates were avoided
- Exact env choice for site selection:
  - whether `RETAILCRM_SITE_CODE` was set
  - which site code was resolved
