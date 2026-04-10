# SPEC

## 1. Functional scope
The system must implement four business capabilities.

### 1.1 Import mock orders into RetailCRM
Input: `mock_orders.json` containing 50 test orders.

System behavior:
- read the JSON file,
- validate or defensively parse the records,
- reconcile fixture fields against the live RetailCRM account when required for a valid upload,
- send them to RetailCRM using the appropriate batch import/upload API,
- log import results clearly,
- fail loudly on malformed data or API failure.

Expected outcome:
- a first live import can create the 50 fixture orders in the RetailCRM demo account,
- repeated import of the same `externalId` values may be rejected by RetailCRM if the account treats them as duplicates,
- repeated duplicate rejection is acceptable for the seed-import path as long as it does not create uncontrolled duplicates.

### 1.2 Synchronize RetailCRM orders into Supabase
System behavior:
- fetch orders from RetailCRM,
- transform them into the project storage model,
- upsert them into Supabase,
- treat the live RetailCRM order record as authoritative for downstream fields such as `currency`, `orderType`, `status`, `site`, and `totalSumm`,
- preserve enough raw upstream data for debugging and traceability,
- maintain sync progress or cursor state,
- support repeated runs without uncontrolled duplication.

Expected outcome:
- Supabase contains the order records needed for dashboard and alerts.

### 1.3 Dashboard
System behavior:
- query order data from Supabase,
- present a web dashboard,
- include at minimum:
  - total orders,
  - total revenue,
  - average check,
  - orders by day chart,
  - latest orders list/table.
- keep the overview screen compact in the first viewport:
  - compact header,
  - period/filter control bar,
  - KPI strip,
  - top of the trend charts.
- keep the interface in Russian.
- keep the screen analytically dense without adding unsupported business entities or fake metrics.
- provide an operational order-detail panel that prioritizes:
  - order number,
  - amount and currency,
  - customer,
  - phone,
  - city,
  - marketing source,
  - order method,
  - item composition,
  - positions count,
  - units count,
  - date.
- avoid showing raw payloads or low-value technical fields by default in the UI.

Constraints:
- dashboard data source must be Supabase only,
- UI should be clean, modern, and product-grade rather than hero-style or admin-template-style,
- reviewer must be able to understand it quickly.
- marketing attribution must be derived in the read/projection layer from persisted `raw_json.customFields.utm_source`,
- operational order method must be derived in the read/projection layer from persisted `raw_json.orderMethod`,
- no schema migration is required for that refinement as long as the dependency on persisted `raw_json` remains explicit.
- if city, item composition, or units count are not stored as dedicated columns, they may be derived from the persisted `raw_json` payload as long as the dependency remains explicit and honest.

Expected outcome:
- working deployed page on Vercel.

### 1.4 Telegram high-value order alerts
System behavior:
- detect orders where the stored upstream order amount is > 50,000 using the live RetailCRM amount/currency contract of record,
- send a Telegram message for such orders,
- deduplicate notifications so the same order does not notify repeatedly,
- keep alerting logic server-side.

Operational note:
- the current live RetailCRM account now returns the imported demo orders with `currency = KZT`,
- later alert logic must therefore compare the numeric amount field as stored by RetailCRM and include the stored currency in the message,
- the alert message should use the same operational field set as the dashboard order details where those values are available from Supabase plus persisted `raw_json`,
- the alert message should expose marketing source and order method as separate lines instead of a mixed source/method label,
- the alert message may additionally include `email` directly under `phone` when that value is present in the persisted `raw_json` and remains operationally useful,
- if city, item composition, or units count are not stored as dedicated columns, they may be derived from persisted `raw_json` without introducing a second upstream read path,
- no implicit currency conversion is part of this assignment unless a later decision introduces it explicitly.

Expected outcome:
- screenshot of a successful Telegram notification.

---

## 2. Deliverables
The final deliverables required by the assignment are:
- Vercel dashboard URL,
- GitHub repository URL,
- Telegram notification screenshot,
- README section describing:
  - prompts used with Codex,
  - where execution got stuck,
  - how issues were solved.

---

## 3. Non-functional requirements

### 3.1 Security
- No real secret in repository.
- No secret exposed to browser bundles.
- RetailCRM and Telegram integrations must be server-side.
- Supabase service-role key must remain server-only.

### 3.2 Reliability
- Sync must be idempotent.
- Alerting must be deduplicated.
- Import and sync scripts must emit useful logs.
- Re-running the seed import may legitimately return duplicate-`externalId` rejection from RetailCRM; this is acceptable if it prevents uncontrolled duplicates and is documented clearly.

### 3.3 Scalability
The system should scale in the limited sense appropriate to this assignment:
- clear separation of upstream source, persistence, and read model,
- explicit dedupe and uniqueness rules,
- simple path to scheduling sync/alerts if needed,
- no architecture that must be rewritten immediately when data volume grows moderately.

This does **not** justify speculative complexity.

### 3.4 Maintainability
- small files,
- direct naming,
- thin adapters,
- explicit SQL/schema semantics,
- documented architectural decisions,
- coherent commits.

### 3.5 Reproducibility
A reviewer should be able to recreate the project from README and environment variables without private explanations.

---

## 4. Constraints
- Prefer TypeScript and Next.js for a unified stack.
- Avoid unnecessary dependencies.
- Avoid ORM by default.
- Avoid generic repository/service patterns.
- No auth unless explicitly needed later.
- No realtime/event-bus/queue architecture unless a documented decision introduces it.

---

## 5. Acceptance criteria

### Import acceptance
- a first import of `mock_orders.json` is loaded into RetailCRM.
- Import logs show success/failure counts.
- if the same `externalId` values are imported again, duplicate rejection is an acceptable outcome for the seed-import path.

### Sync acceptance
- Orders are present in Supabase after sync.
- Re-running sync does not generate uncontrolled duplicates.
- Raw upstream payload is preserved where specified.

### Dashboard acceptance
- Dashboard runs locally.
- Dashboard deploys to Vercel.
- Dashboard renders metrics and chart from Supabase data.

### Telegram acceptance
- Order above threshold triggers notification.
- Repeat checks do not re-send notification for already-alerted order.

### Documentation acceptance
- README documents setup, run, deploy, and troubleshooting.
- README documents AI prompts and resolution notes.
- STATE and CHRONICLE reflect final status.

---

## 6. Explicit anti-goals
The following outcomes are considered failures of discipline:
- browser code calling RetailCRM directly,
- Telegram token present in client bundle,
- dashboard reading directly from upstream CRM,
- duplicate alerts for same order due to missing persistence,
- large abstraction layers with no functional justification,
- documentation that does not describe the actual implementation.
