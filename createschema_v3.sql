-- CaS v3 Schema (fully extensible)
-- Requires PostgreSQL 16+
-- Run e.g. psql -U postgres -d cas -f createschema_v3.sql

-- =============================================
-- 0. Extensions
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. Catalogue tables
-- =============================================
CREATE TABLE unit_codes (
  code           TEXT PRIMARY KEY,
  description    TEXT NOT NULL
);

CREATE TABLE resource_types (
  code           TEXT PRIMARY KEY,
  description    TEXT NOT NULL
);

CREATE TABLE staff_roles (
  code           TEXT PRIMARY KEY,
  description    TEXT NOT NULL
);

CREATE TABLE equipment_types (
  code                 TEXT PRIMARY KEY,
  description          TEXT NOT NULL,
  default_usage_unit   TEXT REFERENCES unit_codes(code)
);

CREATE TABLE service_categories (
  code           TEXT PRIMARY KEY,
  description    TEXT NOT NULL
);

CREATE TABLE currency_codes (
  code        TEXT PRIMARY KEY,
  symbol      TEXT NOT NULL,
  precision   INT  NOT NULL DEFAULT 2
);

INSERT INTO unit_codes (code,description) VALUES
  ('ml','mililitri'),('l','litri'),('h','ore'),('min','minute');

INSERT INTO resource_types VALUES
  ('STAFF','personal'),('EQUIPMENT','echipament'),
  ('CONSUMABLE','consumabil'),('VEHICLE','vehicul'),
  ('WATER','apă'),('ENERGY','energie');

INSERT INTO staff_roles VALUES
  ('WASHER','Spălător'),('DRIVER','Șofer');

INSERT INTO currency_codes VALUES ('RON','lei',2),('EUR','€',2);

-- =============================================
-- 2. Branches & Users
-- =============================================
CREATE TABLE branches (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  address       TEXT,
  city          TEXT,
  lat           DECIMAL(9,6),
  lon           DECIMAL(9,6),
  timezone      TEXT DEFAULT 'UTC',
  phone         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by    INT
);

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  pwd_hash      TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('ADMIN','MANAGER','EMPLOYEE','CUSTOMER')),
  branch_id     INT REFERENCES branches(id),
  first_name    TEXT,
  last_name     TEXT,
  phone         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE employees_profiles (
  employee_id   INT PRIMARY KEY REFERENCES users(id) DEFERRABLE INITIALLY DEFERRED,
  staff_role    TEXT NOT NULL REFERENCES staff_roles(code),
  hourly_rate   DECIMAL(10,2),
  hire_date     DATE
);

-- =============================================
-- 3. Services & Requirements
-- =============================================
CREATE TABLE services (
  id              SERIAL PRIMARY KEY,
  category_code   TEXT NOT NULL REFERENCES service_categories(code),
  name            TEXT NOT NULL,
  description     TEXT,
  base_price      DECIMAL(10,2) NOT NULL,
  currency_code   TEXT REFERENCES currency_codes(code) DEFAULT 'RON',
  avg_duration_min INT NOT NULL
);

CREATE TABLE services_requirements (
  service_id      INT REFERENCES services(id) ON DELETE CASCADE,
  resource_type   TEXT NOT NULL REFERENCES resource_types(code),
  resource_code   TEXT NOT NULL,
  qty_needed      DECIMAL(10,2) NOT NULL,
  unit_code       TEXT REFERENCES unit_codes(code),
  PRIMARY KEY (service_id, resource_type, resource_code)
);

-- =============================================
-- 4. Inventory
-- =============================================
CREATE TABLE consumable_items (
  code          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  unit_code     TEXT NOT NULL REFERENCES unit_codes(code),
  shelf_life_d  INT
);

CREATE TABLE inventory_stocks (
  id            SERIAL PRIMARY KEY,
  branch_id     INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  item_code     TEXT NOT NULL REFERENCES consumable_items(code),
  qty_on_hand   DECIMAL(12,3) NOT NULL DEFAULT 0,
  min_qty       DECIMAL(12,3) NOT NULL DEFAULT 0,
  expire_date   DATE,
  last_updated  TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (branch_id, item_code, expire_date)
);

CREATE TABLE inventory_transactions (
  id            SERIAL PRIMARY KEY,
  stock_id      INT NOT NULL REFERENCES inventory_stocks(id) ON DELETE CASCADE,
  qty_delta     DECIMAL(12,3) NOT NULL,
  reason_code   TEXT NOT NULL CHECK (reason_code IN ('RESTOCK','ORDER','CORRECTION','TRANSFER')),
  ref_table     TEXT,
  ref_id        INT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by    INT
);

CREATE OR REPLACE FUNCTION trg_inventory_update() RETURNS trigger AS $$
BEGIN
  UPDATE inventory_stocks
     SET qty_on_hand = qty_on_hand + NEW.qty_delta,
         last_updated = now()
   WHERE id = NEW.stock_id;

  IF (SELECT qty_on_hand FROM inventory_stocks WHERE id = NEW.stock_id) < 0 THEN
     RAISE EXCEPTION 'Stoc negativ pentru item %, branch %',
       (SELECT item_code FROM inventory_stocks WHERE id=NEW.stock_id),
       (SELECT branch_id FROM inventory_stocks WHERE id=NEW.stock_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_transactions_ai
  AFTER INSERT ON inventory_transactions
  FOR EACH ROW EXECUTE FUNCTION trg_inventory_update();

-- =============================================
-- 5. Equipment & Maintenance
-- =============================================
CREATE TABLE equipment (
  id                SERIAL PRIMARY KEY,
  branch_id         INT NOT NULL REFERENCES branches(id),
  type_code         TEXT REFERENCES equipment_types(code),
  name              TEXT NOT NULL,
  model             TEXT,
  serial_no         TEXT UNIQUE,
  purchase_date     DATE,
  warranty_until    DATE,
  status            TEXT NOT NULL CHECK (status IN ('OPERATIONAL','MAINTENANCE','BROKEN','RETIRED')),
  usage_counter     DECIMAL(12,2) DEFAULT 0,
  usage_unit_code   TEXT REFERENCES unit_codes(code),
  notes             TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE maintenance_tasks (
  id              SERIAL PRIMARY KEY,
  equipment_id    INT REFERENCES equipment(id) ON DELETE CASCADE,
  due_at          TIMESTAMP WITH TIME ZONE,
  task_desc       TEXT,
  mandatory       BOOLEAN DEFAULT true,
  status          TEXT NOT NULL CHECK (status IN ('PENDING','COMPLETED','CANCELLED')),
  completed_at    TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 6. Shifts
-- =============================================
CREATE TABLE shifts (
  id              SERIAL PRIMARY KEY,
  employee_id     INT REFERENCES users(id) ON DELETE CASCADE,
  branch_id       INT REFERENCES branches(id),
  shift_role_code TEXT REFERENCES staff_roles(code),
  start_ts        TIMESTAMP WITH TIME ZONE,
  end_ts          TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 7. Orders & Logistics
-- =============================================
CREATE TABLE orders (
  id              SERIAL PRIMARY KEY,
  customer_id     INT REFERENCES users(id),
  branch_id       INT REFERENCES branches(id),
  status          TEXT NOT NULL CHECK (status IN ('NEW','SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED')),
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end   TIMESTAMP WITH TIME ZONE,
  total_price     DECIMAL(10,2),
  currency_code   TEXT REFERENCES currency_codes(code) DEFAULT 'RON',
  created_via     TEXT CHECK (created_via IN ('WEB','PHONE','ADMIN')) DEFAULT 'WEB',
  notes           TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_orders_branch_status ON orders(branch_id,status);

CREATE TABLE order_items (
  order_id        INT REFERENCES orders(id) ON DELETE CASCADE,
  seq_no          INT NOT NULL,
  service_id      INT REFERENCES services(id),
  qty             INT NOT NULL DEFAULT 1,
  price_unit      DECIMAL(10,2),
  price_total     DECIMAL(10,2),
  notes           TEXT,
  PRIMARY KEY (order_id, seq_no)
);

CREATE TABLE order_assignments (
  order_id      INT REFERENCES orders(id) ON DELETE CASCADE,
  employee_id   INT REFERENCES users(id),
  role_code     TEXT REFERENCES staff_roles(code),
  PRIMARY KEY (order_id, employee_id)
);

CREATE TABLE routes (
  id             SERIAL PRIMARY KEY,
  order_id       INT REFERENCES orders(id) ON DELETE CASCADE,
  type           TEXT CHECK (type IN ('PICKUP','DELIVERY','BOTH')),
  driver_id      INT REFERENCES users(id),
  vehicle        TEXT,
  status         TEXT CHECK (status IN ('PLANNED','ON_ROUTE','DONE')),
  eta            TIMESTAMP WITH TIME ZONE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Recurring orders
CREATE TABLE recurring_orders (
  id               SERIAL PRIMARY KEY,
  customer_id      INT REFERENCES users(id),
  branch_id        INT REFERENCES branches(id),
  base_service_list JSONB NOT NULL,
  rrule            TEXT NOT NULL,
  next_occurrence  TIMESTAMP WITH TIME ZONE,
  active           BOOLEAN DEFAULT true,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 8. Audit
-- =============================================
CREATE TABLE audit_log (
  id            BIGSERIAL PRIMARY KEY,
  table_name    TEXT,
  row_id        TEXT,
  action        TEXT CHECK (action IN ('INSERT','UPDATE','DELETE')),
  diff          JSONB,
  changed_by    INT,
  changed_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE OR REPLACE FUNCTION audit_if_diff() RETURNS trigger AS $$
DECLARE
  data JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    data := to_jsonb(OLD);
  ELSE
    data := to_jsonb(NEW);
  END IF;
  INSERT INTO audit_log(table_name,row_id,action,diff,changed_by)
  VALUES (TG_TABLE_NAME, COALESCE(NEW.id::TEXT,OLD.id::TEXT), TG_OP, data, NULL);
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_if_diff();

CREATE TRIGGER trg_audit_inventory_moves
  AFTER INSERT OR UPDATE OR DELETE ON inventory_transactions
  FOR EACH ROW EXECUTE FUNCTION audit_if_diff();

-- =============================================
-- 9. Comments
-- =============================================
-- Apply comment to the database we are currently connected to (PG16 compatible)
DO $$
BEGIN
  EXECUTE format('COMMENT ON DATABASE %I IS %L', current_database(),
                 'CaS – Cleaning & Scheduling schema v3');
END$$; 