# DATA_MODEL

## Goals
The persistence layer must support:
- dashboard rendering,
- repeatable sync,
- alert deduplication,
- payload traceability.

## Core tables

### 1. `orders`
Purpose:
- canonical persisted representation of upstream RetailCRM orders for dashboard reads and alert checks.

Recommended fields:
- `id` — local surrogate primary key
- `retailcrm_id` — upstream CRM order id, unique
- `external_id` — optional external identifier if present
- `number` — displayable order number if present
- `created_at` — order creation timestamp
- `status` — current order status
- `customer_name` — display-safe name if available
- `phone` — optional customer phone if available and appropriate
- `total_sum` — numeric order amount
- `currency` — order currency code or symbol
- `source` — optional acquisition/source label
- `raw_json` — raw upstream payload as json/jsonb
- `synced_at` — timestamp of last successful upsert into local storage

Required semantics:
- `retailcrm_id` must be unique
- repeat sync must update existing rows instead of inserting duplicates
- `raw_json` should preserve enough upstream detail for troubleshooting

### 2. `sync_state`
Purpose:
- persist the synchronization cursor or equivalent progress marker.

Recommended fields:
- `key` — primary key; examples: `orders_sync_cursor`
- `value` — cursor/state payload stored as `jsonb`
- `updated_at` — timestamp of last update

Required semantics:
- only one active record per logical sync key
- cursor updates happen after successful persistence of synced records

### 3. `alerts_sent`
Purpose:
- deduplicate Telegram notifications.

Recommended fields:
- `retailcrm_id` — primary key or unique key referencing alerted order
- `sent_at` — timestamp message was recorded as sent
- optional `message_hash` or `channel` only if later needed

Required semantics:
- one alert record per order per alert policy
- alert persistence must prevent duplicate sends on repeated checks

---

## Minimal SQL posture
A baseline schema should remain small and explicit.

Recommended relational posture:
- primary key on local `id` for `orders`
- unique constraint on `retailcrm_id`
- primary key on `sync_state.key`
- primary or unique key on `alerts_sent.retailcrm_id`
- read-only public policy only on `orders`; no public policy on `sync_state` or `alerts_sent`

Avoid speculative extra tables until required by implementation.

---

## Data mapping guidance
Map upstream RetailCRM payloads defensively:
- treat absent optional fields as nullable,
- normalize amount fields to numeric,
- preserve original payload in `raw_json`,
- do not over-normalize into many tables for this assignment.

---

## Read model guidance for dashboard
Dashboard needs only a compact read model:
- count of orders,
- sum of `total_sum`,
- average of `total_sum`,
- count grouped by day from `created_at`,
- latest orders ordered by `created_at` or upstream recency.

No materialized views are necessary unless later justified.

---

## Idempotency model
Idempotency is achieved by:
- unique upstream order key in `orders`,
- upsert behavior on sync,
- explicit sync cursor persistence,
- explicit alert dedupe table.

This is the minimum durable mechanism needed for reliable reruns.
