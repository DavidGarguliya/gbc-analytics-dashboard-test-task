# app/

Current Next.js App Router surface for the delivery.

Current contents:
- `layout.tsx` — root metadata, font, and global shell
- `page.tsx` — scaffold landing page for the assignment
- `globals.css` / `page.module.css` — baseline styling

Constraints:
- no direct RetailCRM access from browser code
- no direct Telegram access from browser code
- secrets only in server-side execution paths

Expected future additions:
- dashboard data views
- server routes for operator-triggered actions if later justified
