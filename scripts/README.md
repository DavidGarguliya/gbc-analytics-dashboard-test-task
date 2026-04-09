# scripts/

Operational scripts and local repository guards.

Current contents:
- `check-docs.sh` — local golden check that mirrors required governing docs presence

Expected future contents:
- `import-retailcrm.ts`
- `sync-retailcrm-to-supabase.ts`
- optional alert check script or route trigger helper

Constraints:
- scripts must be idempotent where practical
- scripts must fail loudly on integration errors
- scripts must log progress clearly
