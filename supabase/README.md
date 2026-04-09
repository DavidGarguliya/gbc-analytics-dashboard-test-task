# supabase/

Supabase schema baseline and future migrations.

Current contents:
- `schema.sql` — baseline Postgres schema for `orders`, `sync_state`, and `alerts_sent`

Expected future contents:
- optional migrations if introduced later

Constraints:
- schema changes must be documented in `docs/DATA_MODEL.md`
- uniqueness and dedupe rules must remain explicit
