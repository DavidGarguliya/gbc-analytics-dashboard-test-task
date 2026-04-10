# DEPLOYMENT

## Deployment target
Primary deployment target: Vercel

## Chosen deployment shape
Use Vercel for the dashboard only. Keep import, sync, alerts, and the end-to-end pipeline as local server-side operator commands.

Why this shape:
- it preserves the accepted security boundary
- it avoids exposing RetailCRM and Telegram operations on public routes
- it keeps deployment compact and reviewable

## Deployment prerequisites

### Supabase
- apply [`supabase/schema.sql`](/Users/vincentvega/Desktop/gbc-analytics-dashboard-test-task/supabase/schema.sql) before first deployment verification
- confirm the target project contains the synced `orders` read model

### Vercel env vars for dashboard-only deployment
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional only:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

Not required on Vercel for the accepted deployment shape:
- `RETAILCRM_BASE_URL`
- `RETAILCRM_API_KEY`
- `RETAILCRM_SITE_CODE`
- `SUPABASE_ANON_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## Deployment sequence
1. Authenticate to Vercel.
2. Link the local repository to the Vercel project.
3. Set the dashboard-only Vercel environment variables.
4. Deploy the current Next.js application to production.
5. Verify the deployed dashboard reads the current Supabase data correctly.

Concrete CLI flow:

```bash
vercel login
vercel link
vercel deploy --prod
```

If GitHub login is preferred:

```bash
vercel login --github --oob
```

## Verification after deploy
- the Vercel URL opens successfully
- the dashboard renders `orders` from Supabase rather than RetailCRM
- metrics match the synced Supabase data set
- the latest orders table renders from Supabase data
- no browser-side secret leakage is introduced
- the deployed dashboard works with server-side Supabase env only

## Evidence checklist
At final closeout collect:
- deployed Vercel URL
- GitHub repository URL
- Telegram screenshot from the accepted alert run
- README section covering prompts, blockers, resolutions, and limitations
