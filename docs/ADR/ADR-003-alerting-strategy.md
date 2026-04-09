# ADR-003 — Alerting strategy

## Status
Accepted

## Context
The assignment requires a Telegram notification when a high-value order appears. Repeated checks must not spam duplicates.

## Decision
Implement Telegram alerting as a server-side check with durable deduplication:
- identify orders where `total_sum > 50000`,
- filter out orders already present in `alerts_sent`,
- send Telegram message,
- persist sent state for each alerted order.

## Consequences
Positive:
- deterministic alert behavior,
- rerun-safe execution,
- clear operational model,
- no client-side secret exposure.

Negative:
- requires one small dedupe table,
- exact transactional ordering must be handled carefully in implementation.

## Rejected alternatives
- client-side Telegram calls,
- stateless message sending based on current query only,
- storing alert state only in memory.
