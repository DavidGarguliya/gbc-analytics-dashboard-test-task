# lib/

Shared helpers and thin integration adapters.

Current contents:
- `env.ts` — explicit required environment lookup helper used by server-side code
- `retailcrm-import.ts` — fixture parsing and deterministic RetailCRM import mapping
- `retailcrm.ts` — generic RetailCRM transport and site-resolution helpers
- `supabase.ts` — explicit browser-safe and service-role Supabase client factories

Expected future contents:
- `telegram.ts`
- small pure utility modules if needed

Constraints:
- keep adapters thin
- avoid generic abstraction layers
- prefer explicit types and transformations
