# ARCHITECTURE

## 1. System overview
The system has one upstream source, one persistence/read layer, one presentation layer, and one notification capability.

```text
mock_orders.json
    |
    v
Import Script
    |
    v
RetailCRM
    |
    v
Sync Script / Server-side Sync Flow
    |
    v
Supabase (orders, sync_state, alerts_sent)
    |                \
    |                 \
    v                  v
Dashboard UI         Alert Checker
    |                  |
    v                  v
Vercel               Telegram Bot API
```

## 2. Components

### 2.1 Import flow
Responsibility:
- load the provided JSON fixture,
- normalize records against the supported live-account contract as needed,
- upload them into RetailCRM.

Boundary:
- operational script only,
- not user-facing,
- can use server-side environment variables.

### 2.2 RetailCRM adapter
Responsibility:
- encapsulate RetailCRM HTTP requests,
- provide typed helpers,
- centralize error handling and pagination concerns.

Boundary:
- thin adapter,
- no speculative domain layer.

### 2.3 Sync engine
Responsibility:
- fetch orders or order history from RetailCRM,
- map data into project schema,
- upsert into Supabase,
- update sync cursor/state.

Boundary:
- deterministic and idempotent,
- operational script or server-side trigger.

### 2.4 Supabase persistence and read model
Responsibility:
- store normalized order data,
- preserve raw payload for traceability,
- store synchronization state,
- store alert dedupe state,
- serve as the only dashboard read source,
- derive read-model-only fields such as `marketingSource` and `orderMethod` from persisted `raw_json` without expanding the storage schema.

### 2.5 Dashboard
Responsibility:
- render metrics, trends, breakdowns, a sortable orders table, and an operational order-detail panel,
- read only from Supabase,
- remain small and reviewable.

Boundary:
- no direct upstream CRM access,
- no secrets in client-side paths.
- any operational detail fields not stored as dedicated columns, such as city or item-derived counts, must be derived from the persisted Supabase row plus `raw_json`, not by calling RetailCRM again.

### 2.6 Telegram notifier
Responsibility:
- send readable alert messages for high-value orders,
- use the same operational field set as the dashboard order-detail panel where those values exist in the persisted Supabase read model,
- include persisted `email` in the alert only when it is available from `raw_json` and useful for operator follow-up,
- record that the notification was sent,
- prevent duplicates.

Boundary:
- server-side only.

---

## 3. Invariants

### Data and source invariants
- RetailCRM is upstream for orders.
- Supabase is source of truth for dashboard reads.
- Sync state is explicit and persisted.
- Alert dedupe state is explicit and persisted.
- once an order exists in RetailCRM, downstream phases treat the live RetailCRM record as authoritative even if it differs from the original import fixture intent.

### Boundary invariants
- Browser cannot call RetailCRM.
- Browser cannot call Telegram.
- Secrets exist only server-side.

### Complexity invariants
- One deployable web app repository.
- No background infrastructure beyond what the platform already provides unless justified.
- No speculative modularization.
- If dashboard details and Telegram alerts need the same operational view of an order, use one thin shared projection helper rather than parallel formatting logic.

---

## 4. Data flow detail

### 4.1 Import flow
1. Read `mock_orders.json`.
2. Validate/normalize fields against the live RetailCRM account contract where needed.
3. Upload to RetailCRM batch endpoint.
4. Log counts and failures.

### 4.2 Sync flow
1. Read current sync cursor/state from Supabase.
2. Fetch orders or history from RetailCRM.
3. Transform the live RetailCRM records into storage shape without reconstructing intent from the import fixture.
4. Upsert into `orders`.
5. Update sync cursor/state.
6. Exit with clear logs.

### 4.3 Dashboard flow
1. Query aggregated and recent order data from Supabase.
2. Render summary metrics.
3. Render time-series chart.
4. Render analytical breakdowns and the orders table.
5. When a row is selected, derive the operational detail panel from the stored order row plus persisted `raw_json`, including:
   - `marketingSource` from `raw_json.customFields.utm_source`
   - `orderMethod` from `raw_json.orderMethod`
   - city and item composition from the persisted payload only.

### 4.4 Alert flow
1. Find orders above threshold that have not been alerted.
2. Build the operational alert message from the same persisted order summary rules used by the detail panel, keeping marketing source and order method as separate values.
3. Send Telegram messages.
4. Persist sent alerts in `alerts_sent`.
5. Exit with success/failure logs.

---

## 5. Scale posture
The architecture is intentionally small, but the following design choices support moderate growth without redesign:
- durable storage for sync cursor,
- durable dedupe table for alerts,
- dashboard backed by persisted data instead of live CRM reads,
- explicit thin adapters instead of inlined integration code everywhere.

Not included because unjustified at this scale:
- queueing,
- worker pool,
- event stream,
- generalized sync framework,
- advanced caching.

---

## 6. Failure handling posture
- Fail loudly on integration failures.
- Prefer explicit logs over silent retries.
- Preserve raw payload when useful for debugging.
- Keep recovery simple: fix env/data issue, rerun import/sync/check.

---

## 7. Repository alignment
Implementation is expected to align with:
- `docs/DATA_MODEL.md` for schema semantics,
- `docs/SECURITY_MODEL.md` for boundaries,
- ADR-002 for sync strategy,
- ADR-003 for alert strategy,
- ADR-004 for the original live RetailCRM checkpoint,
- ADR-005 for the current KZT live contract of record.
