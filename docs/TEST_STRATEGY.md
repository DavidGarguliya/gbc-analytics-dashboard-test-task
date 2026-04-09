# TEST_STRATEGY

## Goal
Use a pragmatic test strategy focused on the highest-risk behavior.

## Test priorities

### Priority 1 — mapping and idempotency
Test or verify:
- order normalization from upstream payload,
- upsert behavior keyed by `retailcrm_id`,
- rerun safety for sync,
- dedupe logic for Telegram alerts.

### Priority 2 — integration sanity
Test or verify manually:
- import script can read `mock_orders.json`,
- RetailCRM API calls are correctly authenticated,
- Supabase writes succeed,
- dashboard reads expected rows,
- Telegram message sends successfully.

### Priority 3 — UI sanity
Test or verify:
- dashboard renders without runtime errors,
- empty/loading/error states are reasonable if implemented,
- chart and latest orders display correct fields.

---

## Recommended test mix
- small unit tests for pure transformation logic,
- small unit tests for alert filtering/dedupe decisions if factored cleanly,
- manual integration checks for external systems,
- build/lint/typecheck as mandatory baseline verification.

Avoid overbuilding a large test suite for this assignment.

---

## Minimum verification per milestone

### M1 Scaffold
- install succeeds
- lint/typecheck/build commands exist

### M2 Data model
- schema applies in Supabase
- constraints behave as expected

### M3 Import
- script reads fixture
- script reaches RetailCRM API
- import result is logged clearly

### M4 Sync
- Supabase receives orders
- rerun does not create uncontrolled duplicates
- sync cursor/state updates coherently

### M5 Dashboard
- page renders locally
- metrics match persisted data sample

### M6 Alerts
- qualifying order sends one alert
- rerun does not duplicate the same alert

### M7 Deployment
- Vercel build succeeds
- deployed page loads correctly

---

## Logging guidance
Because external integrations are involved, useful logs are part of the quality bar.

Logs should include:
- start/end of script,
- number of records processed,
- number inserted/updated/sent,
- clear failure reason without leaking secrets.

---

## Final verification checklist
Before final handoff:
- lint passes,
- typecheck passes,
- tests pass if present,
- build passes,
- import demonstrated,
- sync demonstrated,
- dashboard demonstrated,
- Telegram alert demonstrated,
- README finalized.
