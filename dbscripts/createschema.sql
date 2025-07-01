/*********************************************************************
* CaS – Cleaning Web Simulator • schema v1
* rulează acest fișier pe BAZA goală «twproject»
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
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

/* ─────────────────────────────────────────
   3. CLIENȚI & ANGAJAȚI + TURE
   ───────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    user_id     INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    address     TEXT,
    phone       VARCHAR(30),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    employee_id SERIAL PRIMARY KEY,
    user_id     INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(location_id),
    job_title   VARCHAR(60),
    hire_date   DATE NOT NULL
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
    base_price   NUMERIC(10,2) NOT NULL
);

/* ─────────────────────────────────────────
   5. RESURSE & STOC
   ───────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS resources (
    resource_id SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    kind        resource_kind NOT NULL,
    unit        VARCHAR(20)   NOT NULL,      -- ex: L, kg, buc
    unit_cost   NUMERIC(10,2)
);

CREATE TABLE IF NOT EXISTS inventory (
    location_id  INTEGER REFERENCES locations(location_id) ON DELETE CASCADE,
    resource_id  INTEGER REFERENCES resources(resource_id),
    quantity     NUMERIC(12,3) NOT NULL DEFAULT 0,
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
    recurrence_rule  TEXT,
    transport_needed BOOLEAN        NOT NULL DEFAULT FALSE,
    notes            TEXT,
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW()
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
    actual_end      TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_resource_usage (
    order_id    INTEGER REFERENCES orders(order_id)   ON DELETE CASCADE,
    resource_id INTEGER REFERENCES resources(resource_id),
    quantity    NUMERIC(12,3) NOT NULL,
    PRIMARY KEY (order_id, resource_id)
);

/* ─────────────────────────────────────────
   7. ECHIPAMENTE & MENTENANȚĂ
   ───────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS equipment (
    equipment_id SERIAL PRIMARY KEY,
    location_id  INTEGER REFERENCES locations(location_id),
    name         VARCHAR(120)        NOT NULL,
    status       equipment_status    NOT NULL DEFAULT 'OPERATIVE',
    purchased_on DATE,
    notes        TEXT
);

CREATE TABLE IF NOT EXISTS equipment_maintenance (
    maint_id      SERIAL PRIMARY KEY,
    equipment_id  INTEGER REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    started_at    TIMESTAMP NOT NULL,
    ended_at      TIMESTAMP,
    description   TEXT,
    unplanned     BOOLEAN   NOT NULL DEFAULT FALSE
);

/* ─────────────────────────────────────────
   8. MONITORIZARE & METEO & ALERTE
   ───────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS weather_snapshots (
    snapshot_id   SERIAL PRIMARY KEY,
    location_id   INTEGER REFERENCES locations(location_id),
    captured_at   TIMESTAMP      NOT NULL DEFAULT NOW(),
    temperature_c NUMERIC(4,1),
    humidity_pct  SMALLINT,
    condition     VARCHAR(60)
);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id    SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(location_id),
    severity    severity_level NOT NULL,
    title       VARCHAR(150)   NOT NULL,
    message     TEXT,
    created_at  TIMESTAMP      NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP
);

/* ─────────────────────────────────────────
   9. INDICI  (performanță)
   ───────────────────────────────────────── */
CREATE INDEX idx_orders_status        ON orders(status);
CREATE INDEX idx_orders_sched         ON orders(scheduled_for);
CREATE INDEX idx_inventory_resource   ON inventory(resource_id);
CREATE INDEX idx_weather_loc_time     ON weather_snapshots(location_id, captured_at DESC);

-- done ✅