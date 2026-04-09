# lib/

Shared helpers and thin integration adapters.

Current contents:
- `env.ts` — explicit required environment lookup helper used by server-side code
- `pipeline-runner.ts` — pure orchestration contract for the end-to-end local pipeline
- `retailcrm-import.ts` — fixture parsing and deterministic RetailCRM import mapping
- `retailcrm.ts` — generic RetailCRM transport and site-resolution helpers
- `supabase.ts` — explicit browser-safe and service-role Supabase client factories plus alert read/write helpers
- `telegram.ts` — Telegram message formatting and Bot API transport
- `telegram-alerts.ts` — high-value alert runner that loads pending alerts and records dedupe state

Constraints:
- keep adapters thin
- avoid generic abstraction layers
- prefer explicit types and transformations
