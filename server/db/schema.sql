    -- ============================================================================
-- БСО — Схема базы данных (PostgreSQL)
-- Задача 2.1 дорожной карты. Соответствует контракту docs/dashboard-api-schema.json.
-- ============================================================================

BEGIN;

-- --- Перечисления -----------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE org_level      AS ENUM ('center', 'district', 'omu', 'vk_subject', 'vk_mo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_role      AS ENUM ('center_operator', 'district_operator', 'subject_operator', 'vkmo_operator', 'commissioner', 'auditor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE blank_type     AS ENUM ('military_id', 'certificate', 'credential');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE blank_status   AS ENUM ('in_circulation', 'issued', 'on_hold', 'written_off');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE blank_place    AS ENUM ('at_center', 'at_district', 'at_omu', 'at_vk_subject', 'at_vk_mo', 'in_transit', 'with_recipient', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE operation_type AS ENUM ('receipt', 'transfer', 'issue', 'storage', 'return', 'replacement', 'write_off');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE operation_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- Иерархия организационных единиц ----------------------------------------
CREATE TABLE IF NOT EXISTS org_units (
  id         TEXT PRIMARY KEY,
  parent_id  TEXT REFERENCES org_units (id) ON DELETE RESTRICT,
  level      org_level NOT NULL,
  name       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_org_units_parent ON org_units (parent_id);
CREATE INDEX IF NOT EXISTS idx_org_units_level  ON org_units (level);

-- --- Пользователи -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  role         user_role NOT NULL,
  org_unit_id  TEXT REFERENCES org_units (id) ON DELETE SET NULL,
  vkmo_id      TEXT REFERENCES org_units (id) ON DELETE SET NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_users_role    ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_vkmo    ON users (vkmo_id);

-- --- Справочник граждан -----------------------------------------------------
CREATE TABLE IF NOT EXISTS citizens (
  id         TEXT PRIMARY KEY,
  full_name  TEXT NOT NULL,
  snils      TEXT
);

-- --- Бланки строгой отчётности ----------------------------------------------
CREATE TABLE IF NOT EXISTS blanks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number          TEXT NOT NULL UNIQUE CHECK (number ~ '^[А-Я]{2}[0-9]{6}$'),
  type            blank_type   NOT NULL,
  status          blank_status NOT NULL DEFAULT 'in_circulation',
  place           blank_place  NOT NULL DEFAULT 'at_vk_mo',
  location_label  TEXT NOT NULL DEFAULT '',
  vkmo_id         TEXT NOT NULL REFERENCES org_units (id) ON DELETE RESTRICT,
  owner_id        TEXT REFERENCES citizens (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blanks_number  ON blanks (number);
CREATE INDEX IF NOT EXISTS idx_blanks_vkmo    ON blanks (vkmo_id);
CREATE INDEX IF NOT EXISTS idx_blanks_status  ON blanks (status);
CREATE INDEX IF NOT EXISTS idx_blanks_type    ON blanks (type);

-- --- Операции с бланками -----------------------------------------------------
CREATE TABLE IF NOT EXISTS operations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blank_id               UUID NOT NULL REFERENCES blanks (id) ON DELETE CASCADE,
  type                   operation_type   NOT NULL,
  status                 operation_status NOT NULL DEFAULT 'approved',
  reason                 TEXT NOT NULL DEFAULT '',
  from_location          TEXT,
  to_location            TEXT,
  owner_id               TEXT REFERENCES citizens (id) ON DELETE SET NULL,
  operator_id            TEXT NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  commissioner_id        TEXT REFERENCES users (id) ON DELETE SET NULL,
  commissioner_signature TEXT,
  old_blank_id           UUID REFERENCES blanks (id) ON DELETE SET NULL,
  new_blank_id           UUID REFERENCES blanks (id) ON DELETE SET NULL,
  comment                TEXT,
  operator_comment       TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at            TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_operations_blank   ON operations (blank_id);
CREATE INDEX IF NOT EXISTS idx_operations_status  ON operations (status);
CREATE INDEX IF NOT EXISTS idx_operations_type    ON operations (type);
CREATE INDEX IF NOT EXISTS idx_operations_created ON operations (created_at);

-- --- Поступление серий номеров от типографии (2.4) --------------------------
CREATE TABLE IF NOT EXISTS blank_series_receipts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  range_from   TEXT NOT NULL CHECK (range_from ~ '^[А-Я]{2}[0-9]{6}$'),
  range_to     TEXT NOT NULL CHECK (range_to   ~ '^[А-Я]{2}[0-9]{6}$'),
  series_letters TEXT NOT NULL CHECK (char_length(series_letters) <= 2),
  total_count  INTEGER NOT NULL CHECK (total_count >= 1),
  org_unit_id  TEXT NOT NULL REFERENCES org_units (id) ON DELETE RESTRICT,
  operator_id  TEXT NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blank_series_receipt_lines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id  UUID NOT NULL REFERENCES blank_series_receipts (id) ON DELETE CASCADE,
  blank_type  blank_type NOT NULL,
  quantity    INTEGER NOT NULL CHECK (quantity >= 0)
);

-- --- Неизменяемый журнал аудита (2.13) --------------------------------------
-- Только вставка; обновление/удаление запрещены триггером.
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     TEXT,
  user_name   TEXT,
  role        user_role,
  category    TEXT NOT NULL,
  action      TEXT NOT NULL,
  target      TEXT,
  details     TEXT,
  payload     JSONB
);
CREATE INDEX IF NOT EXISTS idx_audit_at       ON audit_log (at);
CREATE INDEX IF NOT EXISTS idx_audit_category ON audit_log (category);
CREATE INDEX IF NOT EXISTS idx_audit_user     ON audit_log (user_id);

CREATE OR REPLACE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log является неизменяемым: % запрещён', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_immutable ON audit_log;
CREATE TRIGGER trg_audit_log_immutable
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();

-- --- Автообновление updated_at у бланков ------------------------------------
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blanks_touch ON blanks;
CREATE TRIGGER trg_blanks_touch
  BEFORE UPDATE ON blanks
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

COMMIT;
