# БСО — модель данных (задача 2.1)

Источник истины по контракту: `../../docs/dashboard-api-schema.json`.
СУБД: PostgreSQL. DDL: [`schema.sql`](./schema.sql). Сид: [`seed.sql`](./seed.sql).

## Сущности и связи

```
org_units (иерархия) ──┐ parent_id → org_units.id (самоссылка)
   ▲   ▲               │
   │   │ vkmo_id       │ org_unit_id
   │   └──────── users ┘
   │                 │ operator_id / commissioner_id
   │                 ▼
   │  vkmo_id      operations ── blank_id ──► blanks ── owner_id ─► citizens
   └───────────── blanks                         ▲                    ▲
                    ▲ owner_id ──────────────────┘                    │
                    │                                  operations.owner_id
   blank_series_receipts ─ org_unit_id → org_units
        │ id
        ▼
   blank_series_receipt_lines (по типам бланков)

   audit_log — неизменяемый журнал (только INSERT)
```

## Таблицы

| Таблица | Назначение | Ключевые поля |
|---|---|---|
| `org_units` | Иерархия (центр → округ → ОМУ → ВК субъекта → ВК МО) | `id`, `parent_id`, `level` |
| `users` | Учётные записи и роли | `id`, `role`, `org_unit_id`, `vkmo_id` |
| `citizens` | Справочник граждан (получатели) | `id`, `full_name`, `snils` |
| `blanks` | Бланки строгой отчётности | `number` (УНИК, `^[А-Я]{2}\d{6}$`), `status`, `place`, `type`, `vkmo_id` |
| `operations` | История операций с бланками | `blank_id`, `type`, `status`, ЭЦП-поля |
| `blank_series_receipts` | Поступление серий номеров от типографии | диапазон, `org_unit_id` |
| `blank_series_receipt_lines` | Разбивка серии по типам | `blank_type`, `quantity` |
| `audit_log` | Неизменяемый журнал аудита (2.13) | INSERT-only, триггер запрещает UPDATE/DELETE |

## Перечисления (ENUM)

`org_level`, `user_role`, `blank_type`, `blank_status`, `blank_place`,
`operation_type`, `operation_status` — значения соответствуют `enums` контракта.

## Инварианты и правила

- Номер бланка уникален и соответствует шаблону `^[А-Я]{2}\d{6}$` (CHECK).
- ЭЦП военного комиссара требуется для операций `issue | replacement | storage`
  в статусе `pending` (бизнес-правило контракта; проверяется на уровне API).
- `blanks.updated_at` обновляется триггером при каждом UPDATE.
- `audit_log` неизменяем: триггер `trg_audit_log_immutable` блокирует UPDATE/DELETE.
- Индексы на `blanks(number, vkmo_id, status, type)` и `operations(blank_id, status, type, created_at)`
  обеспечивают постраничную выдачу реестра в масштабе ~1500 ВК МО.
