# scripts/

Operational scripts and local repository guards.

Current contents:
- `check-docs.sh` — local golden check that mirrors required governing docs presence
- `import-retailcrm.ts` — imports `mock_orders.json` into RetailCRM through the official batch upload endpoint
- `run-pipeline.ts` — runs the full local chain in order: import -> sync -> dashboard read -> Telegram alerts -> final summary
- `run-pipeline.command` — macOS wrapper for `npm run pipeline`
- `run-pipeline.cmd` — Windows wrapper for `npm run pipeline`
- `sync-retailcrm.ts` — pulls live RetailCRM orders, upserts them into Supabase, and persists explicit sync state
- `send-telegram-alerts.ts` — checks Supabase for unalerted KZT orders above the fixed threshold, sends Telegram messages, and records dedupe state

Constraints:
- scripts must be idempotent where practical
- scripts must fail loudly on integration errors
- scripts must log progress clearly
- `npm run pipeline` is the documented local one-command path and auto-loads `.env.local`
