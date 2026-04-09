# scripts/

Operational scripts and local repository guards.

Current contents:
- `check-docs.sh` — local golden check that mirrors required governing docs presence
- `import-retailcrm.ts` — imports `mock_orders.json` into RetailCRM through the official batch upload endpoint
- `sync-retailcrm.ts` — pulls live RetailCRM orders, upserts them into Supabase, and persists explicit sync state

Expected future contents:
- optional alert check script or route trigger helper

Constraints:
- scripts must be idempotent where practical
- scripts must fail loudly on integration errors
- scripts must log progress clearly
