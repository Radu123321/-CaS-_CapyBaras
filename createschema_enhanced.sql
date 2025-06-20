/*********************************************************************
* CaS – Cleaning Web Simulator • Enhanced Schema v2
* Schema îmbunătățit pentru equipment management complet
* Rulează acest fișier pe BAZA goală «twproject»
*********************************************************************/

/* ─────────────────────────────────────────
   0. ENUM-uri  (folosim DO pentru compat.)
   ───────────────────────────────────────── */

-- user_role
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('ADMIN','MANAGER','EMPLOYEE','CUSTOMER');
  END IF;
END$$;

-- service_type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type') THEN
    CREATE TYPE service_type AS ENUM ('CARPET','CAR_WASH','GARMENT','OTHER');
  END IF;
END$$;

-- order_status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('PENDING','SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED');
  END IF;
END$$;

-- transport_status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transport_status') THEN
    CREATE TYPE transport_status AS ENUM ('NOT_REQUIRED','PLANNED','ON_ROUTE','ARRIVED','FINISHED');
  END IF;
END$$;

-- resource_kind
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_kind') THEN
    CREATE TYPE resource_kind AS ENUM ('DETERGENT','BRUSH','WATER','EQUIPMENT','OTHER');
  END IF;
END$$;

-- severity_level
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severity_level') THEN
    CREATE TYPE severity_level AS ENUM ('INFO','WARNING','CRITICAL');
  END IF;
END$$;

-- equipment_status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_status') THEN
    CREATE TYPE equipment_status AS ENUM ('OPERATIVE','OUT_OF_SERVICE','UNDER_MAINTENANCE');
  END IF;
END$$;

-- equipment_type (nou)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_type') THEN
    CREATE TYPE equipment_type AS ENUM ('WASHING_MACHINE','DRYER','VACUUM_CLEANER','PRESSURE_WASHER','STEAM_CLEANER','CARPET_CLEANER','OTHER');
  END IF;
END$$;

-- maintenance_type (nou)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_type') THEN
    CREATE TYPE maintenance_type AS ENUM ('PREVENTIVE','CORRECTIVE','EMERGENCY','INSPECTION');
  END IF;
END$$;

-- maintenance_status (nou)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_status') THEN
    CREATE TYPE maintenance_status AS ENUM ('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED');
  END IF;
END$$;

/* ─────────────────────────────────────────
   1. UTILIZATORI & ROLURI
   ───────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS users (
    user_id        SERIAL PRIMARY KEY,
    email          VARCHAR(120) UNIQUE NOT NULL,
    password_hash  VARCHAR(255)        NOT NULL,
    full_name      VARCHAR(120)        NOT NULL,
    default_role   user_role           NOT NULL,
    created_at     TIMESTAMP           NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP           NOT NULL DEFAULT NOW(),
    is_active      BOOLEAN             NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    role    user_role NOT NULL,
    PRIMARY KEY (user_id, role)
);

/* ─────────────────────────────────────────
   2. LOCAȚII
   ───────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS locations (
    location_id SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    address     TEXT         NOT NULL,
    latitude    NUMERIC(9,6),
    longitude   NUMERIC(9,6),
    timezone    VARCHAR(40)  NOT NULL DEFAULT 'Europe/Bucharest',
    phone       VARCHAR(30),
    email       VARCHAR(120),
    manager_id  INTEGER REFERENCES users(user_id),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

/* ─────────────────────────────────────────
   3. CLIENȚI & ANGAJAȚI + TURE
   ───────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    user_id     INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    address     TEXT,
    phone       VARCHAR(30),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    employee_id SERIAL PRIMARY KEY,
    user_id     INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(location_id),
    job_title   VARCHAR(60),
    hire_date   DATE NOT NULL,
    salary      NUMERIC(10,2),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS shifts (
    shift_id    SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
    start_time  TIMESTAMP NOT NULL,
    end_time    TIMESTAMP NOT NULL,
    UNIQUE (employee_id, start_time)
);

/* ─────────────────────────────────────────
   4. SERVICII
   ───────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS services (
    service_id   SERIAL PRIMARY KEY,
    service_type service_type NOT NULL,
    description  TEXT,
    base_price   NUMERIC(10,2) NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

/* ─────────────────────────────────────────
   5. RESURSE & STOC
   ───────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS resources (
    resource_id SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    kind        resource_kind NOT NULL,
    unit        VARCHAR(20)   NOT NULL,      -- ex: L, kg, buc
    unit_cost   NUMERIC(10,2),
    supplier    VARCHAR(100),
    min_stock   NUMERIC(12,3) DEFAULT 10,    -- minimum stock level
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
    location_id  INTEGER REFERENCES locations(location_id) ON DELETE CASCADE,
    resource_id  INTEGER REFERENCES resources(resource_id),
    quantity     NUMERIC(12,3) NOT NULL DEFAULT 0,
    last_restock TIMESTAMP,
    updated_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    PRIMARY KEY (location_id, resource_id)
);

/* ─────────────────────────────────────────
   6. COMENZI + TRANSPORT + CONSUM
   ───────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS orders (
    order_id         SERIAL PRIMARY KEY,
    customer_id      INTEGER REFERENCES customers(customer_id),
    location_id      INTEGER REFERENCES locations(location_id),
    status           order_status   NOT NULL DEFAULT 'PENDING',
    scheduled_for    TIMESTAMP,
    completed_at     TIMESTAMP,
    recurrence_rule  TEXT,
    transport_needed BOOLEAN        NOT NULL DEFAULT FALSE,
    total_price      NUMERIC(10,2),
    notes            TEXT,
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    order_id   INTEGER REFERENCES orders(order_id)   ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(service_id),
    quantity   SMALLINT CHECK (quantity > 0),
    price      NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (order_id, service_id)
);

CREATE TABLE IF NOT EXISTS transports (
    transport_id    SERIAL PRIMARY KEY,
    order_id        INTEGER UNIQUE REFERENCES orders(order_id),
    status          transport_status NOT NULL DEFAULT 'NOT_REQUIRED',
    driver_name     VARCHAR(120),
    vehicle_plate   VARCHAR(20),
    estimated_start TIMESTAMP,
    estimated_end   TIMESTAMP,
    actual_start    TIMESTAMP,
    actual_end      TIMESTAMP,
    cost            NUMERIC(10,2),
    notes           TEXT
);

CREATE TABLE IF NOT EXISTS order_resource_usage (
    order_id    INTEGER REFERENCES orders(order_id)   ON DELETE CASCADE,
    resource_id INTEGER REFERENCES resources(resource_id),
    quantity    NUMERIC(12,3) NOT NULL,
    cost        NUMERIC(10,2),
    PRIMARY KEY (order_id, resource_id)
);

/* ─────────────────────────────────────────
   7. ECHIPAMENTE & MENTENANȚĂ (ENHANCED)
   ───────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS equipment (
    equipment_id     SERIAL PRIMARY KEY,
    location_id      INTEGER REFERENCES locations(location_id),
    name             VARCHAR(120)        NOT NULL,
    equipment_type   equipment_type      NOT NULL DEFAULT 'OTHER',
    status           equipment_status    NOT NULL DEFAULT 'OPERATIVE',
    serial_number    VARCHAR(100),
    manufacturer     VARCHAR(100),
    model            VARCHAR(100),
    purchased_on     DATE,
    purchase_price   NUMERIC(10,2),
    warranty_until   DATE,
    last_maintenance TIMESTAMP,
    next_maintenance TIMESTAMP,
    usage_hours      INTEGER DEFAULT 0,
    efficiency_score NUMERIC(3,2) DEFAULT 1.00,  -- 0.00 to 1.00
    notes            TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment_maintenance (
    maintenance_id   SERIAL PRIMARY KEY,
    equipment_id     INTEGER REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    maintenance_type maintenance_type NOT NULL DEFAULT 'PREVENTIVE',
    status           maintenance_status NOT NULL DEFAULT 'SCHEDULED',
    scheduled_date   TIMESTAMP NOT NULL,
    started_at       TIMESTAMP,
    completed_at     TIMESTAMP,
    technician_name  VARCHAR(120),
    description      TEXT,
    cost             NUMERIC(10,2),
    parts_replaced   TEXT,
    next_maintenance TIMESTAMP,
    unplanned        BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Equipment usage tracking pentru efficiency calculations
CREATE TABLE IF NOT EXISTS equipment_usage_log (
    usage_id     SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    order_id     INTEGER REFERENCES orders(order_id),
    start_time   TIMESTAMP NOT NULL,
    end_time     TIMESTAMP,
    usage_hours  NUMERIC(5,2),
    efficiency   NUMERIC(3,2), -- performance during this usage
    notes        TEXT,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

/* ─────────────────────────────────────────
   8. MONITORIZARE & METEO & ALERTE (ENHANCED)
   ───────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS weather_snapshots (
    snapshot_id   SERIAL PRIMARY KEY,
    location_id   INTEGER REFERENCES locations(location_id),
    captured_at   TIMESTAMP      NOT NULL DEFAULT NOW(),
    temperature_c NUMERIC(4,1),
    humidity_pct  SMALLINT,
    condition     VARCHAR(60),
    wind_speed    NUMERIC(4,1),
    precipitation NUMERIC(4,1)
);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id    SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(location_id),
    equipment_id INTEGER REFERENCES equipment(equipment_id),
    severity    severity_level NOT NULL,
    alert_type  VARCHAR(50) NOT NULL, -- 'EQUIPMENT_FAILURE', 'MAINTENANCE_DUE', etc.
    title       VARCHAR(150)   NOT NULL,
    message     TEXT,
    created_at  TIMESTAMP      NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(user_id)
);

/* ─────────────────────────────────────────
   9. STATISTICI & PERFORMANCE (NEW)
   ───────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS daily_stats (
    stat_id         SERIAL PRIMARY KEY,
    location_id     INTEGER REFERENCES locations(location_id),
    date            DATE NOT NULL,
    orders_count    INTEGER DEFAULT 0,
    revenue         NUMERIC(10,2) DEFAULT 0,
    resource_cost   NUMERIC(10,2) DEFAULT 0,
    maintenance_cost NUMERIC(10,2) DEFAULT 0,
    efficiency_avg  NUMERIC(3,2) DEFAULT 1.00,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (location_id, date)
);

/* ─────────────────────────────────────────
   10. INDICI  (performanță)
   ───────────────────────────────────────── */
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_sched         ON orders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_orders_location      ON orders(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_resource   ON inventory(resource_id);
CREATE INDEX IF NOT EXISTS idx_weather_loc_time     ON weather_snapshots(location_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_location   ON equipment(location_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status     ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment ON equipment_maintenance(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled ON equipment_maintenance(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_alerts_location      ON alerts(location_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created       ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_equipment      ON equipment_usage_log(equipment_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_location ON daily_stats(location_id, date DESC);

/* ─────────────────────────────────────────
   11. TRIGGERS pentru automated updates
   ───────────────────────────────────────── */

-- Trigger pentru updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger la toate tabelele cu updated_at
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.columns 
             WHERE column_name = 'updated_at' AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_updated_at ON %I', t);
        EXECUTE format('CREATE TRIGGER trigger_updated_at 
                       BEFORE UPDATE ON %I 
                       FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()', t);
    END LOOP;
END $$;

-- Trigger pentru equipment efficiency update
CREATE OR REPLACE FUNCTION update_equipment_efficiency()
RETURNS TRIGGER AS $$
BEGIN
    -- Update equipment efficiency based on recent usage
    UPDATE equipment 
    SET efficiency_score = (
        SELECT COALESCE(AVG(efficiency), 1.00)
        FROM equipment_usage_log 
        WHERE equipment_id = NEW.equipment_id 
        AND start_time >= NOW() - INTERVAL '30 days'
    ),
    usage_hours = usage_hours + COALESCE(NEW.usage_hours, 0)
    WHERE equipment_id = NEW.equipment_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_equipment_efficiency
    AFTER INSERT OR UPDATE ON equipment_usage_log
    FOR EACH ROW EXECUTE PROCEDURE update_equipment_efficiency();

-- done ✅ Enhanced Schema v2 