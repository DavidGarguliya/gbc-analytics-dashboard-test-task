# DEPLOYMENT

## Deployment target
Primary deployment target: Vercel

## Expected deployment shape
- Next.js application deployed to Vercel
- environment variables configured in Vercel project settings
- dashboard accessible through Vercel URL

## Required environment variables
- `RETAILCRM_BASE_URL`
- `RETAILCRM_API_KEY`
- optional `RETAILCRM_SITE_CODE`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `NEXT_PUBLIC_APP_URL`

## Deployment sequence
1. Create Vercel project and connect the repository.
2. Set all required environment variables.
3. Trigger deployment.
4. Verify the dashboard loads and queries Supabase correctly.
5. If server-side routes are used for sync/alerts, verify they run in the deployed environment or remain local-only if that is the chosen operational mode.

## Operational choices
There are two acceptable operating patterns for this assignment:

### Option A — deploy dashboard only, run scripts locally
Use Vercel only for the dashboard UI.
Run import/sync/alerts locally from scripts.

Pros:
- simpler,
- lower deployment risk,
- easier to debug.

Cons:
- less self-contained.

### Option B — deploy dashboard plus server-side operator routes
Expose internal server routes for admin-triggered sync/alert checks.

Pros:
- more cohesive web deployment.

Cons:
- requires additional care for route safety and invocation.

Recommendation:
Choose the simplest option that satisfies the assignment and keeps security boundaries clear.

## Verification after deploy
- dashboard URL opens successfully,
- key metrics render,
- recent orders render,
- no browser-side integration errors for secret-bearing systems,
- README contains the final deployed URL.

## Evidence checklist
At final closeout collect:
- deployed Vercel URL,
- GitHub repository URL,
- Telegram screenshot,
- README prompt and troubleshooting section.
