# БСО — серверное API

Серверная часть системы учёта бланков строгой отчётности (раздел 2 дорожной карты).
Реализует согласованную схему `../docs/dashboard-api-schema.json`.

## Стек

- **Node.js + TypeScript**, фреймворк **Fastify 5** (валидация по JSON Schema, OpenAPI/Swagger).
- **PostgreSQL** (продакшен). Без `DATABASE_URL` сервер поднимается на **in-memory** данных,
  засеянных демо-набором — удобно для разработки, тестов и автономной демонстрации.
- Зависимости устанавливаются локально (offline-friendly для Astra Linux).

## Запуск

```bash
cd server
npm install
cp .env.example .env        # при необходимости
npm run dev                 # tsx watch, http://localhost:3001
# или
npm run build && npm start
```

- API: `http://localhost:3001/v1`
- Swagger UI: `http://localhost:3001/docs`
- Health: `http://localhost:3001/v1/health`

## База данных (PostgreSQL)

Локально удобнее через Docker Compose (порт 5433):

```bash
docker compose up -d                                          # PostgreSQL 15
export DATABASE_URL=postgres://bso:bso@localhost:5433/bso
npm run db:migrate          # применить db/schema.sql (задача 2.1)
npm run db:seed             # загрузить демо-данные
npm run dev                 # теперь источник данных — PostgreSQL
```

Активный источник виден в `GET /v1/health` → `storage: "postgres" | "memory"`.
Схема: [`db/schema.sql`](./db/schema.sql) · модель: [`db/ERD.md`](./db/ERD.md).

## Эндпоинты (раздел 2.2–2.6)

| Метод | Путь | Назначение | Задача |
|---|---|---|---|
| GET | `/v1/health` | Проверка доступности | 2.2 |
| GET | `/v1/dashboard/summary` | Сводные счётчики бланков по статусам/типам | 2.2 |
| GET | `/v1/dashboard/operations-chart` | Динамика операций по дням | 2.2 |
| GET | `/v1/dashboard/distribution-by-org` | Распределение по дочерним узлам иерархии | 2.2 |
| GET | `/v1/blanks` | Реестр бланков с фильтрами и пагинацией | 2.2 |
| GET | `/v1/blanks/:id` | Карточка бланка с историей операций | 2.3 |
| GET | `/v1/operations` | Журнал операций | 2.2 |
| GET | `/v1/operations/pending-signatures` | Очередь на подпись комиссара | 2.2 |
| POST | `/v1/receipts` | Поступление серии бланков от типографии | 2.4 |
| POST | `/v1/transfers` | Распределение на дочерний узел (контроль лимитов) | 2.5 |
| POST | `/v1/operations` | Операция с бланком (выдача/возврат/замена/хранение/списание) | 2.6 |

Операции `issue`/`storage`/`replacement` создаются в статусе `pending` (требуют ЭЦП комиссара,
очередь — `pending-signatures`, подписание — задача 2.7); `return`/`write_off` применяются сразу.
Каждая запись фиксируется в неизменяемом `audit_log` (основа задачи 2.13).

## Архитектура

```
src/
  domain.ts        перечисления, типы, бизнес-правила
  aggregate.ts     чистые функции агрегации (иерархия, счётчики, график)
  series.ts        разбор/генерация номеров серий, место по уровню (2.4–2.5)
  operations.ts    переходы состояний бланка по типу операции (2.6)
  presenters.ts    доменные строки → DTO контракта
  schemas.ts       JSON-схемы маршрутов (валидация + OpenAPI)
  routes.ts        обработчики эндпоинтов
  app.ts           сборка Fastify (CORS, Swagger, маршруты)
  index.ts         точка входа
  repo/
    types.ts       интерфейс Repository (чтение + запись)
    memory.ts      in-memory (засеяно seed-data)
    postgres.ts    PostgreSQL (pg), записи в транзакциях
    index.ts       фабрика выбора источника
  seed-data.ts     демо-данные (синхронизированы с фронтендом)
```

Бизнес-логика операций (`operations.ts`, `series.ts`) — чистые функции, общие для обоих
репозиториев; PostgreSQL выполняет записи в транзакциях с `FOR UPDATE` (защита от гонок
при распределении). Следующие задачи раздела 2 (ЭЦП на сервере 2.7, перемещения 2.8,
отчёты 2.9, аудит-лог 2.13) надстраиваются поверх этого слоя.
