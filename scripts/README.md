# scripts/

Операционные скрипты и локальные repository guards.

Содержимое каталога:

- `check-docs.sh` — локальная golden-проверка обязательных governing docs
- `import-retailcrm.ts` — импортирует `mock_orders.json` в RetailCRM через batch upload endpoint
- `sync-retailcrm.ts` — тянет live orders из RetailCRM, upsert-ит их в Supabase и сохраняет explicit `sync_state`
- `send-telegram-alerts.ts` — читает из Supabase неотправленные high-value orders, отправляет Telegram alerts и записывает дедупликацию
- `run-pipeline.ts` — запускает локальную цепочку `import -> sync -> dashboard read -> Telegram alerts -> final summary`
- `run-pipeline.command` — macOS wrapper для `npm run pipeline`
- `run-pipeline.cmd` — Windows wrapper для `npm run pipeline`

Инварианты:

- скрипты должны быть idempotent там, где это практически возможно
- скрипты должны fail loud при интеграционных ошибках
- прогресс должен логироваться явно
- `npm run pipeline` остаётся документированным one-command локальным путём и поднимает `.env.local`
