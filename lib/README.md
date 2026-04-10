# lib/

Общие helper-модули, read-model builders и тонкие интеграционные адаптеры.

Основные файлы:

- `env.ts` — явное получение обязательных environment variables
- `dashboard-data.ts` — серверная загрузка данных для dashboard
- `dashboard-read.ts` — чистый Supabase read path для dashboard вне App Router оболочки
- `dashboard.ts` — построение KPI, trends и breakdown-модели dashboard
- `order-operational.ts` — единая operational projection для detail panel и Telegram alert
- `pipeline-runner.ts` — orchestration contract локального end-to-end pipeline
- `retailcrm.ts` — общий RetailCRM transport и reference helpers
- `retailcrm-import.ts` — deterministic import mapping из fixture в RetailCRM payload
- `retailcrm-sync.ts` — live sync `RetailCRM -> Supabase` с upsert и explicit sync state
- `supabase.ts` — browser-safe и service-role Supabase clients плюс read/write helpers
- `telegram.ts` — форматирование Telegram alert и Bot API transport
- `telegram-alerts.ts` — high-value alert runner c дедупликацией

Тесты:

- `*.test.ts` рядом с соответствующими модулями фиксируют ключевые инварианты импорта, sync, dashboard, projection и alerting

Инварианты:

- адаптеры должны оставаться тонкими
- нельзя добавлять лишние abstraction layers без реальной необходимости
- предпочтительны явные типы, преобразования и deterministic behavior
- маркетинговый источник и способ оформления должны оставаться раздельными сущностями
