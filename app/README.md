# app/

Текущая App Router поверхность dashboard.

Содержимое каталога:

- `layout.tsx` — корневой layout, metadata и глобальная оболочка приложения
- `page.tsx` — server-side entrypoint dashboard, который читает данные только из Supabase
- `dashboard-view.tsx` — основная React-вёрстка overview, фильтров, графиков, breakdown-карточек, таблицы и detail panel
- `globals.css` — глобальные переменные, базовые стили и shared surface tokens
- `page.module.css` — модульные стили dashboard, включая текущий single-row desktop layout для breakdown-блоков

Инварианты:

- browser code не должен обращаться к RetailCRM напрямую
- browser code не должен обращаться к Telegram напрямую
- secrets допустимы только в server-side execution paths
- dashboard остаётся Supabase-only read surface
- интерфейс сохраняет русский язык и не смешивает `marketingSource` с `orderMethod`
