# lib/

Shared helpers and thin integration adapters.

Current contents:
- `env.ts` — explicit required environment lookup helper used by server-side code
- `supabase.ts` — explicit browser-safe and service-role Supabase client factories

Expected future contents:
- `retailcrm.ts`
- `telegram.ts`
- small pure utility modules if needed

Constraints:
- keep adapters thin
- avoid generic abstraction layers
- prefer explicit types and transformations
