# API_CONTRACTS

## Purpose
Document the expected integration boundaries and internal contract shape. Exact endpoint details may be refined during implementation, but behavior must stay within these contracts.

---

## 1. RetailCRM adapter contract
The adapter should provide a compact typed interface such as:

### `uploadOrdersBatch(input)`
Purpose:
- upload a batch of parsed orders from `mock_orders.json` into RetailCRM.

Inputs:
- array of normalized order payloads

Outputs:
- success/failure result with counts and error details where available

### `listOrders(params)` or `listOrderHistory(params)`
Purpose:
- fetch orders or incremental history from RetailCRM for synchronization.

Inputs:
- optional pagination / cursor / date filters

Outputs:
- upstream order payloads and next paging/cursor information if available

### `getOrderById(id)` (optional)
Purpose:
- fetch a single order if targeted diagnostics are needed.

---

## 2. Supabase persistence contract
The persistence layer should provide explicit operations such as:

### `upsertOrders(orders)`
Purpose:
- persist normalized orders by unique `retailcrm_id`.

Behavior:
- insert if new,
- update if existing,
- preserve `raw_json`,
- set `synced_at`.

### `getSyncState(key)`
Purpose:
- read the current sync cursor.

### `setSyncState(key, value)`
Purpose:
- persist updated sync cursor after a successful sync slice.

### `getUnalertedHighValueOrders(threshold)`
Purpose:
- return orders above threshold that do not exist in `alerts_sent`.

### `markAlertSent(retailcrmId)`
Purpose:
- persist notification dedupe record.

---

## 3. Telegram adapter contract
### `sendHighValueOrderAlert(order)`
Purpose:
- send a readable Telegram message for a high-value order.

Expected message content:
- order number or id,
- amount,
- currency,
- status,
- created timestamp.

Behavior:
- fail loudly on Telegram API errors,
- never run client-side.

---

## 4. Internal route contract (optional)
If an operator-triggered Next.js API route is used, it should remain server-side and constrained.

Examples:
- `POST /api/admin/check-high-value-orders`
- `POST /api/admin/sync-orders`

Constraints:
- do not expose dangerous mutation routes publicly without protective context,
- prefer local script execution if no operator route is required for the assignment.

---

## 5. Dashboard data contract
Dashboard needs a compact view model such as:
- `totalOrders: number`
- `totalRevenue: number`
- `averageCheck: number`
- `ordersByDay: Array<{ date: string; count: number }>`
- `latestOrders: Array<{ retailcrmId: number; number: string | null; createdAt: string; totalSum: number; status: string | null }>`

This may be produced by:
- direct SQL queries,
- Supabase query composition,
- a small server-side mapping layer.

No additional internal API is required unless it meaningfully simplifies deployment or server/client boundaries.
