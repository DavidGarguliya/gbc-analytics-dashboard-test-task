# SECURITY_MODEL

## Security objective
Keep the system simple while enforcing correct secret handling and boundary separation.

## Trust boundaries

### Browser / client
Allowed:
- read public dashboard data through safe paths,
- use public env variables only.

Forbidden:
- RetailCRM API access,
- Telegram API access,
- Supabase service-role usage,
- any secret-bearing request construction.

### Server-side application / scripts
Allowed:
- RetailCRM API access,
- Supabase service-role access,
- Telegram Bot API access,
- operational import/sync/alert actions.

---

## Secret inventory
Expected secrets:
- `RETAILCRM_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- potentially Supabase anon/public keys for browser-safe usage

Rules:
- real values only in deployment or local environment files excluded from git,
- never interpolate secrets into client-visible output,
- never log full token values.

---

## Data exposure posture
Potentially sensitive data includes customer names and phones present in order payloads.

Guidance:
- persist only what is needed for the assignment,
- do not unnecessarily display sensitive fields in the dashboard,
- do not include private customer details in Telegram beyond what is useful and proportionate.

---

## Integration boundaries

### RetailCRM
- access only from scripts or server-side routes/helpers.
- centralize HTTP logic in a thin adapter.

### Supabase
- browser may use anon/public client only if needed for read-safe paths.
- all privileged writes and sync operations use server-side/service-role context.

### Telegram
- server-side only.
- dedupe must persist before or immediately after successful send according to chosen transactional posture.

---

## Threats to avoid
- accidental client bundling of server-only modules,
- hardcoded secrets in code or README,
- direct dashboard dependency on upstream CRM availability,
- duplicate alerts due to stateless notification logic,
- silent partial sync that leaves inconsistent local state without any logs.

---

## Security checks before closing a task
- verify imported server-only code is not referenced from client components,
- verify env variables are split into public and private correctly,
- verify logs do not print tokens,
- verify README uses placeholders, not live credentials,
- verify no dangerous debug endpoints are left open unintentionally.
