# RetailCRM → Supabase → Dashboard

Тестовое задание, в котором реализована полная рабочая цепочка:

1. импорт 50 заказов из `mock_orders.json` в RetailCRM  
2. синхронизация заказов из RetailCRM в Supabase  
3. построение дашборда только на данных из Supabase  
4. Telegram-уведомления по крупным заказам  
5. публикация дашборда на Vercel  

---

## Что в итоге сделано

Проект доведён до рабочего состояния и покрывает весь основной сценарий задания:

- загружает тестовые заказы из `mock_orders.json` в RetailCRM;
- синхронизирует заказы из RetailCRM в Supabase;
- строит дашборд только поверх Supabase read model;
- отправляет Telegram-уведомления по заказам с суммой выше `50 000 KZT`;
- разворачивает дашборд на Vercel;
- поддерживает единый локальный pipeline-запуск всей цепочки.

---

## Публичные ссылки

- **Vercel:** `https://gbc-analytics-dashboard-test-task.vercel.app`
- **GitHub:** `https://github.com/DavidGarguliya/gbc-analytics-dashboard-test-task`

---

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

### Ключевые принципы

- **RetailCRM** — единственный upstream-источник заказов  
- **Supabase** — единственный источник данных для dashboard и alert-check  
- дашборд **не читает RetailCRM напрямую**  
- Telegram alerting работает **только server-side**  
- дедупликация уведомлений хранится явно в таблице `alerts_sent`  
- правило для алерта: `total_sum > 50 000 KZT`  
- валюта в текущем live-контракте — **KZT**

---

## Как была организована разработка

Разработка шла не как один большой “проход агентом”, а по этапам, с заранее зафиксированными правилами и артефактами.

До начала основной реализации в репозиторий были добавлены:

- `AGENTS.md` — правила работы для AI-assisted development
- `docs/` — спецификация, архитектура, план, состояние, журнал изменений
- `docs/ADR/` — архитектурные решения

На практике это позволило:

- зафиксировать инварианты до начала кодинга;
- не потерять контекст между итерациями;
- вести работу milestone-by-milestone;
- документировать важные решения не задним числом, а по ходу реализации.

---

## Что сейчас умеет система

### 1. Импорт заказов в RetailCRM

Проект импортирует 50 тестовых заказов из `mock_orders.json` в RetailCRM.

### 2. Синхронизация RetailCRM → Supabase

Синхронизация выполнена через upsert-модель, поэтому повторный запуск безопасен и не создаёт дублей в Supabase.

### 3. Дашборд

Дашборд полностью построен на Supabase и не обращается к RetailCRM напрямую.

Сейчас overview-экран показывает:

- заголовок и время последней синхронизации;
- фильтры;
- KPI;
- графики динамики;
- breakdown-блоки;
- таблицу заказов;
- детализацию выбранного заказа.

### 4. Telegram alerts

Telegram alert runner:

- работает только server-side;
- берёт данные только из Supabase;
- отправляет уведомления по заказам выше `50 000 KZT`;
- не отправляет дубли за счёт таблицы `alerts_sent`.

### 5. Единый pipeline

Есть единая точка входа для локального запуска всей цепочки:

```bash
npm run pipeline
```

Также есть wrapper-скрипты:

- macOS: `./scripts/run-pipeline.command`
- Windows: `scripts\run-pipeline.cmd`

---

## Что показывает дашборд

Экран дашборда полностью русскоязычный и строится только на синхронизированных данных из Supabase.

### Overview

На экране есть:

- KPI по заказам и выручке;
- динамика заказов и выручки по периоду;
- breakdown по статусам;
- breakdown по маркетинговым источникам;
- breakdown по способу оформления;
- распределение по сумме заказа;
- таблицу заказов с drilldown.

### Детали заказа

В панели деталей заказа по умолчанию показываются только операционно полезные поля:

- номер заказа
- сумма и валюта
- клиент
- телефон
- email
- город
- маркетинговый источник
- способ оформления
- состав заказа
- количество позиций
- количество единиц товара
- дата

Дополнительно есть вторичный технический блок с:

- `RetailCRM ID`
- `External ID`

### Telegram alert

Формат уведомления был доработан так, чтобы менеджер сразу видел:

- номер заказа
- сумму
- клиента
- телефон
- город
- источник
- состав заказа
- количество позиций / единиц товара
- дату

Если в `raw_json` сохранён email, он также может быть показан в alert.

---

## Важная особенность source analytics

В процессе разработки пришлось развести две разные сущности:

- **marketing source** — источник привлечения (`utm_source`)
- **order method** — способ оформления заказа (`orderMethod`)

Изначально историческое поле `orders.source` смешивало эти значения, что делало аналитику нечестной.  
В финальной версии:

- `marketingSource` строится только из `raw_json.customFields.utm_source`
- `orderMethod` строится только из `raw_json.orderMethod`

Это позволило отдельно анализировать:

- `instagram`
- `google`
- `tiktok`
- `direct`
- `referral`

и не смешивать их с `shopping-cart`.

---

## Стек

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Postgres
- `@supabase/supabase-js`
- RetailCRM HTTP API
- Telegram Bot API
- Vercel

---

## Структура проекта

- `app/` — Next.js UI
- `lib/` — адаптеры, read-model builders, shared helpers
- `scripts/` — import / sync / alerts / pipeline
- `supabase/schema.sql` — базовая схема
- `docs/` — спецификация, ADR, состояние проекта, журнал изменений

---

## Переменные окружения

### Локальный запуск

Скопируйте `.env.example` в `.env.local`:

```bash
cp .env.example .env.local
```

Заполните:

| Переменная | Где нужна | Комментарий |
| --- | --- | --- |
| `RETAILCRM_BASE_URL` | import, sync, pipeline | только server-side |
| `RETAILCRM_API_KEY` | import, sync, pipeline | только server-side |
| `RETAILCRM_SITE_CODE` | optional import, sync | если нужно явно задать site |
| `SUPABASE_URL` | dashboard server read, sync, alerts, pipeline | |
| `SUPABASE_SERVICE_ROLE_KEY` | dashboard server read, sync, alerts, pipeline | только server-side |
| `TELEGRAM_BOT_TOKEN` | alerts, pipeline | только server-side |
| `TELEGRAM_CHAT_ID` | alerts, pipeline | только server-side |
| `NEXT_PUBLIC_APP_URL` | optional | удобно для handoff |

### Для Vercel

В текущей production-схеме на Vercel нужен только dashboard, поэтому обязательны:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Локальный запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Подготовка `.env.local`

```bash
cp .env.example .env.local
```

### 3. Применение схемы Supabase

Перед первым sync и запуском dashboard нужно применить:

- `supabase/schema.sql`

Схема создаёт таблицы:

- `orders`
- `sync_state`
- `alerts_sent`

### 4. Проверка проекта

```bash
npm run docs:golden
npm run lint
npm run typecheck
npm run test
npm run build
```

---

## Основные команды

Импорт заказов в RetailCRM:

```bash
npm run import:retailcrm
```

Синхронизация в Supabase:

```bash
npm run sync:retailcrm
```

Telegram alerts:

```bash
npm run alerts:telegram
```

Полный локальный pipeline:

```bash
npm run pipeline
```

---

## Развёртывание на Vercel

### 1. Авторизация и линковка

```bash
vercel login
vercel link
```

### 2. Настройка env vars

Добавьте на Vercel:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Production deploy

```bash
vercel deploy --prod
```

### 4. Что нужно проверить после деплоя

- открывается главная страница;
- KPI и таблица читаются из Supabase;
- detail panel работает;
- в браузер не утекают секреты RetailCRM / Telegram.

---

## Какие проблемы возникли и как они решались

### 1. RetailCRM reference endpoints вернули payload не в ожидаемом формате

**Проблема:** import-адаптер ожидал массив, а live payload пришёл в object-shaped виде.  
**Решение:** адаптер был обновлён под фактический контракт live API.

### 2. В live account был только один поддерживаемый `orderType`

**Проблема:** ожидаемое значение из fixture не поддерживалось аккаунтом.  
**Решение:** была добавлена deterministic reconciliation логика для `orderType`.

### 3. Повторный import не работает как update-path

**Проблема:** повторный импорт возвращал duplicate rejection по `externalId`.  
**Решение:** это было зафиксировано как честное seed-import поведение. Повторный запуск не создаёт неконтролируемых дублей.

### 4. Валюта в live RetailCRM сначала сохранялась как `RUB`, а не `KZT`

**Проблема:** это ломало честность downstream-аналитики.  
**Решение:** сначала был исправлен upstream-контракт в RetailCRM, затем выполнен повторный sync в Supabase.

### 5. Telegram alerts сначала не проходили live verification

**Проблема:** не был задан `TELEGRAM_CHAT_ID`.  
**Решение:** chat id был извлечён через bot updates flow после сообщения боту.

### 6. Pipeline runner не мог использовать Next.js `server-only` module

**Проблема:** общий pipeline не мог импортировать dashboard read path напрямую.  
**Решение:** reusable Supabase read layer был вынесен в отдельный `lib/dashboard-read.ts`.

### 7. `.env.local` не подхватывался автоматически в pipeline

**Проблема:** локальный pipeline запускался не всегда предсказуемо.  
**Решение:** entrypoint был переведён на запуск через `--env-file=.env.local`.

### 8. Telegram alert сначала показывал слишком бедный состав заказа

**Проблема:** formatter читал не все реальные поля live item payload.  
**Решение:** operational projection был расширен под `productName`, `offer.displayName` и `offer.name`.

### 9. Source analytics сначала была нечестной

**Проблема:** поле `orders.source` смешивало marketing source и order method.  
**Решение:** projection layer был разделён на `marketingSource` и `orderMethod`.

### 10. В live RetailCRM не было custom field `utm_source`

**Проблема:** невозможно было честно восстановить маркетинговые источники из live-заказов.  
**Решение:** custom field был создан через RetailCRM API, после чего был сделан backfill 50 заказов и повторный sync.

---

## Что использовалось при AI-assisted разработке

Работа велась поэтапно, с жёсткими scope-ограничениями. Основные запросы к агенту сводились к таким шагам:

1. подготовить foundation для controlled development;
2. реализовать import в RetailCRM;
3. зафиксировать и примирить live-контракт RetailCRM;
4. реализовать sync в Supabase;
5. построить dashboard только на Supabase;
6. исправить live currency contract до `KZT`;
7. реализовать Telegram alerts с дедупликацией;
8. добавить единый pipeline runner;
9. развести `marketingSource` и `orderMethod`;
10. довести dashboard, deployment и handoff до reviewer-ready состояния.

---

## Финальный checklist

- [x] Есть Vercel URL
- [x] Есть GitHub URL
- [x] Приложен Telegram screenshot
- [x] Задокументированы требования к Supabase schema
- [x] Задокументированы локальные env
- [x] Задокументированы Vercel env
- [x] Есть pipeline instructions
- [x] Описаны реальные проблемы и решения

---

## Итог

В репозитории реализована полная рабочая цепочка:

`mock_orders.json → RetailCRM → Supabase → Dashboard → Telegram alerts → Vercel`

Система доведена до честного рабочего состояния с такими свойствами:

- live-контракт по валюте — `KZT`
- правило alert: `total_sum > 50 000 KZT`
- dashboard строится только на Supabase
- Telegram alerts дедуплицируются через `alerts_sent`
- marketing source и order method разделены честно
- вся цепочка может запускаться одной локальной командой через pipeline runner
