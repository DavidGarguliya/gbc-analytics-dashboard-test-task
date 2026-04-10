# supabase/

Базовая Supabase schema и авторитетная точка описания storage-структуры проекта.

Содержимое каталога:

- `schema.sql` — baseline Postgres schema для `orders`, `sync_state` и `alerts_sent`

Что важно:

- схема должна быть применена до первого live sync и до server-side чтения dashboard
- изменения схемы нужно синхронно отражать в `docs/DATA_MODEL.md`
- uniqueness, upsert и dedupe rules должны оставаться явными
- hidden persistence layers добавлять нельзя
