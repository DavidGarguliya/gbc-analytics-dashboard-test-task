# RetailCRM -> Supabase -> Dashboard

Компактная, но production-shaped реализация тестового задания:

- импортировать 50 заказов из `mock_orders.json` в RetailCRM
- синхронизировать заказы из RetailCRM в Supabase
- показывать dashboard только из Supabase read model
- отправлять серверные Telegram-уведомления по заказам выше `50 000 KZT`
- публиковать dashboard на Vercel

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

Актуальный live-контракт:

- RetailCRM — единственный upstream-источник заказов
- Supabase — единственный источник данных для dashboard и alert-check
- валюта в сохранённых данных сейчас `KZT`
- правило алерта: `total_sum > 50 000` без валютной конвертации
- дедупликация алертов хранится явно в `alerts_sent`

## Что сейчас показывает dashboard

Текущий overview-экран:

- полностью на русском языке
- остаётся Supabase-only read screen
- показывает compact header, control bar, KPI, trends, breakdowns и orders drilldown
- использует detail panel заказа в том же операционном формате, что и Telegram alert

Операционные поля в detail panel:

- номер заказа
- сумма и валюта
- клиент
- телефон
- город
- источник / метод
- состав заказа
- количество позиций
- количество единиц товара
- дата

Дополнительно для Telegram alert:

- email сразу под телефоном, если он уже есть в сохранённом `raw_json`

Важно:

- `customer_name` и `phone` читаются из сохранённой строки `orders`
- `city`, `items`, `positions`, `units` сейчас честно выводятся из сохранённого `orders.raw_json`
- реальные названия позиций читаются из сохранённого item payload, включая live RetailCRM shape `items[*].offer.displayName` / `items[*].offer.name`
- raw payload целиком в UI не показывается
- full address и email по умолчанию не показываются в UI

## Технологии

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Postgres через `@supabase/supabase-js`
- RetailCRM HTTP API
- Telegram Bot API
- Vercel для хостинга dashboard

## Структура репозитория

- `app/` — Next.js UI
- `lib/` — тонкие адаптеры и общие server-side helper modules
- `scripts/` — операционные команды import / sync / alerts / pipeline
- `supabase/schema.sql` — авторитетная базовая схема
- `docs/` — governing docs, ADR, текущее состояние и журнал milestone-изменений

## Принятая схема деплоя

На Vercel развёрнут только dashboard.

Import, sync, alerts и полный pipeline остаются server-side командами, которые запускаются локально оператором. Это соответствует принятому scope:

- не выносит RetailCRM и Telegram в публичный веб-контур
- сохраняет корректные client/server границы
- не добавляет лишние admin routes, scheduler и orchestration слой

## Обязательные prerequisites

- Node.js `>=20.9.0`
- npm `>=10.0.0`
- Supabase project с применённой схемой из `supabase/schema.sql`
- RetailCRM credentials для локального import/sync
- Telegram bot token и chat id для локального alert run
- Vercel account для dashboard deployment

## Обязательные зависимости перед запуском

### 1. Supabase schema должна быть применена

Перед первым sync, локальной проверкой dashboard или Vercel deployment нужно применить:

- `supabase/schema.sql`

Схема создаёт:

- `orders`
- `sync_state`
- `alerts_sent`

Без этого sync и серверный read-path dashboard работать корректно не будут.

### 2. Переменные окружения

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

Опционально, если позже появится browser-safe usage или понадобится хранить публичный URL:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

Не нужны на Vercel при текущем accepted contract:

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

Примените `supabase/schema.sql` к целевому проекту Supabase до первого sync.

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

## Один запуск всего pipeline

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

Нужно проверить:

- домашняя страница открывается
- метрики приходят из Supabase
- последние заказы приходят из Supabase
- detail panel заказа открывается из таблицы и показывает операционный набор полей
- в клиент не утекли RetailCRM / Telegram secrets
- server-side runtime работает только на обязательных Supabase env vars

## Команды проверки

Обязательные repository gates:

```bash
npm run docs:golden
npm run lint
npm run typecheck
npm run test
npm run build
```

Опциональный локальный production smoke:

```bash
npm run start -- --hostname 127.0.0.1 --port 4010
curl http://127.0.0.1:4010
```

## Какие промпты использовались с Codex

Работа шла не одним большим расплывчатым запросом, а milestone-by-milestone с жёсткими scope-ограничениями. Ключевые рабочие промпты были такими:

1. Построить foundation для импорта `mock_orders.json` в RetailCRM, сохранить deterministic behavior и остановиться на live-checkpoint.
2. Примирить фактический live-контракт RetailCRM с ожидаемым контрактом до любого downstream development.
3. Реализовать RetailCRM -> Supabase sync с явным `sync_state` и безопасными rerun.
4. Реализовать dashboard, который читает только Supabase и не переинтерпретирует валюту на UI.
5. Переоткрыть currency contract, сначала исправить upstream account на `KZT`, затем повторно синхронизировать Supabase.
6. Реализовать Telegram alerts для сохранённых заказов выше `50 000 KZT`, с явной дедупликацией и только server-side.
7. Добавить один исполняемый локальный pipeline runner для цепочки import -> sync -> dashboard read -> alerts.
8. Довести Vercel deployment, README и handoff materials до reviewer-ready состояния без расширения product scope.

## Где реализация застревала

| Блокер | Где проявился | Как был решён |
| --- | --- | --- |
| RetailCRM reference endpoints вернули object-shaped payload вместо ожидаемого массива | M3 live import | адаптер был обновлён так, чтобы принимать фактическую форму live payload |
| В live account оказался только один поддерживаемый `orderType`: `main` | M3 live import | добавлена deterministic reconciliation логика для `orderType` в import mapping |
| Изначально live RetailCRM account сохранял imported demo orders как `RUB`, а не `KZT` | post-M5 contract review | сначала исправлен upstream account, затем повторно выполнен sync, чтобы Supabase и dashboard оставались truthful |
| Telegram delivery был заблокирован, потому что `TELEGRAM_CHAT_ID` не был задан явно | M6 live verification | chat id был извлечён через bot updates flow после сообщения боту |
| Pipeline script не мог импортировать Next.js `server-only` dashboard module | M7 implementation | reusable Supabase read path был вынесен в `lib/dashboard-read.ts`, а App Router wrapper остался тонким |
| `npm run pipeline` изначально не поднимал `.env.local` автоматически | M7 live verification | entrypoint был переведён на Node `--env-file=.env.local` |

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
- [x] Blockers и resolutions задокументированы
- [x] Known limitations задокументированы

## Evidence inventory

- Vercel URL: `https://gbc-analytics-dashboard-test-task.vercel.app`
- GitHub repo URL: `https://github.com/DavidGarguliya/gbc-analytics-dashboard-test-task`
- Telegram screenshot: нужно приложить screenshot из принятой M6 live alert verification
- Submission-ready summary: репозиторий реализует полную цепочку `mock_orders.json -> RetailCRM -> Supabase -> Dashboard -> Telegram alerts -> Vercel`, с live-контрактом `KZT`, правилом алерта `total_sum > 50 000 KZT`, явной дедупликацией в `alerts_sent` и one-command локальным pipeline runner для повторяемого operator execution
