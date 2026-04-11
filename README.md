# RetailCRM -> Supabase -> Dashboard

Компактная, но production-shaped реализация тестового задания со следующей целевой цепочкой:

- импортировать 50 заказов из `mock_orders.json` в RetailCRM
- синхронизировать заказы из RetailCRM в Supabase
- строить dashboard только поверх Supabase read model
- отправлять серверные Telegram-уведомления по заказам выше `50 000 KZT`
- опубликовать dashboard на Vercel

## Что в итоге реализовано

- live import `mock_orders.json -> RetailCRM`
- idempotent sync `RetailCRM -> Supabase`
- Supabase-only dashboard на Next.js
- server-side Telegram alert runner c дедупликацией в `alerts_sent`
- локальный one-command pipeline
- production deployment dashboard на Vercel

Публичные артефакты:

- Vercel URL: `https://gbc-analytics-dashboard-test-task.vercel.app`
- GitHub URL: `https://github.com/DavidGarguliya/gbc-analytics-dashboard-test-task`

## Архитектура

```text
mock_orders.json
  -> import script
  -> RetailCRM
  -> sync script
  -> Supabase (orders, sync_state, alerts_sent)
  -> Next.js dashboard on Vercel

Supabase
  -> Telegram alert runner
```

Актуальный контракт системы:

- RetailCRM — единственный upstream-источник заказов
- Supabase — единственный источник данных для dashboard и alert-check
- dashboard не читает RetailCRM напрямую
- Telegram alerting остаётся только server-side
- валюта в сохранённых данных сейчас `KZT`
- маркетинговая атрибуция читается только из `raw_json.customFields.utm_source`
- операционный способ оформления читается только из `raw_json.orderMethod`
- правило алерта: `total_sum > 50 000` без валютной конвертации
- дедупликация алертов хранится явно в `alerts_sent`

## Что сейчас показывает dashboard

Overview-экран:

- полностью на русском языке
- остаётся Supabase-only read screen
- показывает header, фильтры, KPI, trends, breakdown-блоки и drilldown-таблицу
- breakdown-блоки на широком desktop располагаются в один ряд из четырёх карточек:
  - `Источник заказа`
  - `Распределение по сумме заказа`
  - `Заказы по статусам`
  - `Способ оформления`
- блок `Источник заказа` считает источник только по `utm_source`
- блок `Источник заказа` показывает по каналу:
  - число заказов
  - выручку
  - средний чек
  - число крупных заказов
  - долю выручки
  - comparison-period context

Order details по умолчанию показывают:

- номер заказа
- сумму и валюту
- клиента
- телефон
- город
- маркетинговый источник
- способ оформления
- состав заказа
- количество позиций
- количество единиц товара
- дату

Telegram alert дополнительно показывает:

- email сразу под телефоном, если он уже есть в сохранённом `raw_json`

Важно:

- `customer_name` и `phone` читаются из сохранённой строки `orders`
- `marketingSource` строится только из `orders.raw_json.customFields.utm_source`
- `orderMethod` строится только из `orders.raw_json.orderMethod`
- сохранённый `orders.source` не используется как честный маркетинговый источник, потому что исторически смешивал `utm_source` и `orderMethod`
- `city`, `items`, `positions`, `units` выводятся из сохранённого `orders.raw_json`
- реальные названия позиций читаются из live item payload, включая `items[*].offer.displayName` и `items[*].offer.name`
- raw payload, полный адрес и email по умолчанию в UI не показываются

## Технологии

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Postgres через `@supabase/supabase-js`
- RetailCRM HTTP API
- Telegram Bot API
- Vercel для хостинга dashboard

## Структура репозитория

- `app/` — Next.js UI и dashboard surface
- `lib/` — тонкие адаптеры, read-model builders и shared helpers
- `scripts/` — operator commands для import / sync / alerts / pipeline
- `supabase/schema.sql` — авторитетная базовая схема
- `docs/` — governing docs, ADR, текущее состояние и журнал milestone-изменений

## Принятая схема deployment

На Vercel развёрнут только dashboard.

Import, sync, alerts и полный pipeline остаются server-side командами, которые запускаются локально оператором. Это сохраняет корректные client/server границы:

- RetailCRM не выводится в публичный веб-контур
- Telegram не выводится в публичный веб-контур
- не добавляются лишние admin routes, scheduler и orchestration layers

## Обязательные prerequisites

- Node.js `>=20.9.0`
- npm `>=10.0.0`
- Supabase project с применённой схемой из `supabase/schema.sql`
- RetailCRM credentials для локального import/sync
- Telegram bot token и chat id для локального alert run
- Vercel account для dashboard deployment

## Переменные окружения

### Локальный полный pipeline

Скопируйте `.env.example` в `.env.local`:

```bash
cp .env.example .env.local
```

Заполните:

| Переменная | Где нужна | Комментарий |
| --- | --- | --- |
| `RETAILCRM_BASE_URL` | local import, sync, pipeline | только server-side |
| `RETAILCRM_API_KEY` | local import, sync, pipeline | только server-side |
| `RETAILCRM_SITE_CODE` | optional local import, sync | фиксирует site code |
| `SUPABASE_URL` | dashboard server read, sync, alerts, pipeline | тот же проект, где применена схема |
| `SUPABASE_SERVICE_ROLE_KEY` | dashboard server read, sync, alerts, pipeline | только server-side |
| `SUPABASE_ANON_KEY` | optional future browser-safe parity | текущий dashboard не использует |
| `NEXT_PUBLIC_SUPABASE_URL` | optional future browser-safe parity | текущий dashboard не использует |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional future browser-safe parity | текущий dashboard не использует |
| `TELEGRAM_BOT_TOKEN` | local alerts, pipeline | только server-side |
| `TELEGRAM_CHAT_ID` | local alerts, pipeline | только server-side |
| `NEXT_PUBLIC_APP_URL` | optional public URL | полезно для handoff и публичных ссылок |

### Vercel: текущий dashboard-only runtime

Для текущего deployment shape обязательны только:

| Переменная | Нужна на Vercel | Почему |
| --- | --- | --- |
| `SUPABASE_URL` | да | server-side read path dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | да | server-side read path dashboard |

Опционально:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

Не нужны на Vercel при текущем контракте:

- `RETAILCRM_BASE_URL`
- `RETAILCRM_API_KEY`
- `RETAILCRM_SITE_CODE`
- `SUPABASE_ANON_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## Локальный запуск

### 1. Установить зависимости

```bash
npm install
```

### 2. Подготовить `.env.local`

```bash
cp .env.example .env.local
```

### 3. Применить схему Supabase

До первого sync, локальной проверки dashboard или Vercel deployment нужно применить:

- `supabase/schema.sql`

Схема создаёт:

- `orders`
- `sync_state`
- `alerts_sent`

### 4. Прогнать quality gates

```bash
npm run docs:golden
npm run lint
npm run typecheck
npm run test
npm run build
```

## Операторские команды

Импорт fixture-заказов в RetailCRM:

```bash
npm run import:retailcrm
```

Синхронизация RetailCRM -> Supabase:

```bash
npm run sync:retailcrm
```

Telegram alerts по high-value orders:

```bash
npm run alerts:telegram
```

Полная локальная цепочка:

```bash
npm run pipeline
```

Wrapper scripts:

- macOS: `./scripts/run-pipeline.command`
- Windows: `scripts\\run-pipeline.cmd`

Наблюдаемое поведение при rerun:

- import может честно закончиться `Uploaded orders: 0` из-за duplicate-safe rejection по `externalId`
- sync остаётся upsert-based и rerun-safe
- dashboard остаётся полностью Supabase-backed
- alerts остаются дедуплицированными и могут честно вернуть `Pending alerts found: 0`

## Развёртывание на Vercel

Текущая production-схема: dashboard-only deployment.

### 1. Авторизация и линковка проекта

```bash
vercel login
vercel link
```

Если нужен browser/device flow:

```bash
vercel login --github --oob
```

### 2. Настроить env vars на Vercel

Добавьте production env:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

При необходимости:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

### 3. Production deploy

```bash
vercel deploy --prod
```

### 4. Что проверить после deploy

- домашняя страница открывается
- метрики приходят из Supabase
- последние заказы приходят из Supabase
- detail panel заказа открывается из таблицы и показывает операционный набор полей
- в клиент не утекли RetailCRM / Telegram secrets
- server-side runtime работает только на обязательных Supabase env vars

## Какие промпты использовались с Codex

Работа шла milestone-by-milestone с жёсткими scope-ограничениями. Ключевые рабочие промпты были такими:

1. Построить foundation для импорта `mock_orders.json` в RetailCRM, сохранить deterministic behavior и остановиться на live-checkpoint.
2. Примирить фактический live-контракт RetailCRM с ожидаемым контрактом до любого downstream development.
3. Реализовать RetailCRM -> Supabase sync с явным `sync_state` и безопасными rerun.
4. Реализовать dashboard, который читает только Supabase и не переинтерпретирует валюту на UI.
5. Переоткрыть currency contract, сначала исправить upstream account на `KZT`, затем повторно синхронизировать Supabase.
6. Реализовать Telegram alerts для сохранённых заказов выше `50 000 KZT`, с явной дедупликацией и только server-side.
7. Добавить один исполняемый локальный pipeline runner для цепочки import -> sync -> dashboard read -> alerts.
8. Развести `marketing_source` и `order_method` в projection layer без schema migration и без смешивания семантик.
9. Вернуть честную source analytics по каналам после проверки live RetailCRM contract для `utm_source`.
10. Довести Vercel deployment, README и handoff materials до reviewer-ready состояния без расширения product scope.

## Проблемы, которые встретились, и как они были решены

| Проблема | Где проявилась | Как была решена |
| --- | --- | --- |
| RetailCRM reference endpoints вернули object-shaped payload вместо ожидаемого массива | live import | адаптер был обновлён так, чтобы принимать фактическую форму live payload |
| В live account оказался только один поддерживаемый `orderType`: `main` | live import | добавлена deterministic reconciliation логика для `orderType` в import mapping |
| Повторный import не шёл по update-path и возвращал duplicate rejection по `externalId` | rerun import | это было зафиксировано как честное seed-import поведение; uncontrolled duplicates не создаются |
| Изначально live RetailCRM account сохранял imported demo orders как `RUB`, а не `KZT` | currency contract review | сначала исправлен upstream account, затем повторно выполнен sync, чтобы Supabase и dashboard оставались truthful |
| Telegram delivery был заблокирован, потому что `TELEGRAM_CHAT_ID` не был задан явно | live verification alerts | chat id был извлечён через bot updates flow после сообщения боту |
| Pipeline script не мог импортировать Next.js `server-only` dashboard module | pipeline implementation | reusable Supabase read path был вынесен в `lib/dashboard-read.ts`, а App Router wrapper остался тонким |
| `npm run pipeline` изначально не поднимал `.env.local` автоматически | pipeline live verification | entrypoint был переведён на Node `--env-file=.env.local` |
| В live payload реальные названия товаров лежали не только в `productName`, но и в `items[*].offer.displayName` / `items[*].offer.name` | details panel и Telegram alert | shared operational projection был обновлён под фактическую форму live item payload |
| Исторически поле `orders.source` смешивало маркетинговый источник и операционный способ оформления | source analytics review | projection layer был разделён на `marketingSource` и `orderMethod`, а legacy `orders.source` перестал использоваться как честный marketing dimension |
| В live RetailCRM account вообще не было order custom field `utm_source` | source analytics live verification | custom field `utm_source` был создан через официальный RetailCRM API |
| После этого все старые 50 заказов всё ещё оставались без `utm_source` в Supabase | live data backfill | был выполнен bulk backfill существующих заказов из `mock_orders.json` в RetailCRM и затем повторный sync в Supabase |
| Из-за отсутствия `utm_source` dashboard и Telegram честно показывали `Источник: Не указан`, хотя fixture содержал `instagram`, `google`, `tiktok`, `direct`, `referral` | source analytics UI и Telegram | после создания поля и backfill каналы снова появились в live pipeline и в Supabase read model |
| Breakdown-карточки на overview сначала были логически перегружены, а затем оказались не в том desktop-layout, который нужен для финальной подачи | UI refinement | карточки были сначала упорядочены и очищены от лишних подписей, а затем переведены в один ряд из четырёх карточек на широком desktop с responsive fallback для более узких экранов |

## Известные ограничения

- На Vercel развёрнут только dashboard. Import, sync, alerts и полный pipeline остаются локальными operator commands.
- Текущий deployed dashboard server-rendered из Supabase и пока не использует browser-safe Supabase env vars.
- Alert runner работает по модели send-then-mark. Если процесс упадёт после успешной отправки и до записи в `alerts_sent`, при следующем rerun один и тот же заказ может уйти повторно.
- Import path остаётся seed-import сценарием. На rerun duplicate rejection по `externalId` считается честным безопасным результатом, а не update path.
- Windows launcher присутствует и документирован, но live-verified в этой сессии был только macOS launcher.
- Финальная submission package всё ещё требует приложить внешний Telegram screenshot из принятой live-verification.

## Финальный checklist handoff

- [x] Vercel dashboard URL зафиксирован
- [x] GitHub repository URL зафиксирован
- [ ] Telegram screenshot приложен
- [x] Требование применить Supabase schema задокументировано
- [x] Локальные env requirements задокументированы
- [x] Vercel env requirements задокументированы
- [x] Локальные pipeline instructions задокументированы
- [x] Реальные проблемы и способы их решения задокументированы
- [x] Known limitations задокументированы

## Evidence inventory

- Vercel URL: `https://gbc-analytics-dashboard-test-task.vercel.app`
- GitHub repo URL: `https://github.com/DavidGarguliya/gbc-analytics-dashboard-test-task`
- Telegram screenshot: нужно приложить screenshot из принятой live alert verification
- Submission-ready summary: репозиторий реализует полную цепочку `mock_orders.json -> RetailCRM -> Supabase -> Dashboard -> Telegram alerts -> Vercel`, с live-контрактом `KZT`, правилом алерта `total_sum > 50 000 KZT`, явной дедупликацией в `alerts_sent`, честным разделением `marketingSource` и `orderMethod`, а также one-command локальным pipeline runner для повторяемого operator execution

## Личное замечание

Выполняя эту задачу, я получил колоссальное удовольствие от поставленной задачи: в ней было достаточно реальной интеграционной сложности, чтобы приходилось не «рисовать демо», а аккуратно разбирать живые контракты, устранять несовпадения данных и доводить систему до честного рабочего состояния без лишнего переусложнения.
