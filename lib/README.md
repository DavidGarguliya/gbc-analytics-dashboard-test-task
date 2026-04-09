# lib/

Shared helpers and thin integration adapters.

Current contents:
- `env.ts` — explicit required environment lookup helper used by server-side code

Expected future contents:
- `retailcrm.ts`
- `supabase.ts`
- `telegram.ts`
- small pure utility modules if needed

Constraints:
- keep adapters thin
- avoid generic abstraction layers
- prefer explicit types and transformations
