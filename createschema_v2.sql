-- =====================================================
-- CaS (Cleaning and Services) Database Schema v2.0
-- Sistema Web pentru managementul spalatoriilor
-- =====================================================

-- Ștergere tabele existente (în ordine inversă dependențelor)
DROP TABLE IF EXISTS rss_feeds CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS exception_reports CASCADE;
DROP TABLE IF EXISTS weather_conditions CASCADE;
DROP TABLE IF EXISTS maintenance_schedules CASCADE;
DROP TABLE IF EXISTS equipment_usage_logs CASCADE;
DROP TABLE IF EXISTS resource_consumption CASCADE;
DROP TABLE IF EXISTS inventory_alerts CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS transport_requests CASCADE;
DROP TABLE IF EXISTS order_resources CASCADE;
DROP TABLE IF EXISTS recurring_schedules CASCADE;
DROP TABLE IF EXISTS order_reviews CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS employee_shifts CASCADE;
DROP TABLE IF EXISTS location_services CASCADE;
DROP TABLE IF EXISTS service_resources CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- TABELA UTILIZATORI (Users)
-- =====================================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER')),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA LOCAȚII/SEDII (Locations)
-- =====================================================
CREATE TABLE locations (
    location_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    postal_code VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    email VARCHAR(100),
    manager_id INTEGER REFERENCES users(user_id),
    operating_hours JSONB, -- Format: {"monday": {"open": "08:00", "close": "18:00"}, ...}
    capacity INTEGER DEFAULT 10, -- Numărul maxim de comenzi simultane
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA ANGAJAȚI (Employees)
-- =====================================================
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(location_id),
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    position VARCHAR(50) NOT NULL,
    hourly_rate DECIMAL(10, 2),
    hire_date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    skills TEXT[], -- Array cu competențele (ex: ['CAR_WASH', 'CARPET_CLEANING'])
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA CLIENȚI (Customers)
-- =====================================================
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    customer_code VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(100), -- Pentru clienți corporativi
    billing_address TEXT,
    preferred_location_id INTEGER REFERENCES locations(location_id),
    loyalty_points INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0.00,
    preferred_contact_method VARCHAR(20) DEFAULT 'EMAIL' CHECK (preferred_contact_method IN ('EMAIL', 'PHONE', 'SMS')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA SERVICII (Services)
-- =====================================================
CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('CARPET', 'CAR_WASH', 'GARMENT', 'UPHOLSTERY', 'OTHER')),
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL, -- Durata estimată în minute
    requires_transport BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA ECHIPAMENTE (Equipment)
-- =====================================================
CREATE TABLE equipment (
    equipment_id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(location_id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('WASHING_MACHINE', 'DRYER', 'VACUUM', 'PRESSURE_WASHER', 'IRON', 'OTHER')),
    manufacturer VARCHAR(50),
    model VARCHAR(50),
    serial_number VARCHAR(100) UNIQUE,
    purchase_date DATE,
    warranty_expiry DATE,
    status VARCHAR(20) DEFAULT 'OPERATIVE' CHECK (status IN ('OPERATIVE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED')),
    last_maintenance DATE,
    next_maintenance DATE,
    usage_hours INTEGER DEFAULT 0,
    efficiency_rating DECIMAL(3, 2) DEFAULT 1.00, -- 0.00 - 1.00
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA RESURSE/CONSUMABILE (Resources)
-- =====================================================
CREATE TABLE resources (
    resource_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('DETERGENT', 'CHEMICAL', 'TOOL', 'CONSUMABLE', 'OTHER')),
    category VARCHAR(50), -- Ex: 'CARPET_CLEANER', 'CAR_SHAMPOO', 'FABRIC_SOFTENER'
    unit_of_measure VARCHAR(20) NOT NULL, -- Ex: 'LITER', 'KG', 'PIECE'
    unit_cost DECIMAL(10, 4) NOT NULL,
    supplier VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA SERVICII-RESURSE (Service Resources)
-- =====================================================
CREATE TABLE service_resources (
    service_id INTEGER REFERENCES services(service_id) ON DELETE CASCADE,
    resource_id INTEGER REFERENCES resources(resource_id) ON DELETE CASCADE,
    quantity_needed DECIMAL(10, 4) NOT NULL, -- Cantitatea necesară per serviciu
    is_optional BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (service_id, resource_id)
);

-- =====================================================
-- TABELA LOCAȚII-SERVICII (Location Services)
-- =====================================================
CREATE TABLE location_services (
    location_id INTEGER REFERENCES locations(location_id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(service_id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT TRUE,
    price_modifier DECIMAL(5, 4) DEFAULT 1.0000, -- Modificator de preț pentru locația specifică
    PRIMARY KEY (location_id, service_id)
);

-- =====================================================
-- TABELA INVENTAR (Inventory)
-- =====================================================
CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(location_id),
    resource_id INTEGER REFERENCES resources(resource_id),
    current_stock DECIMAL(10, 4) NOT NULL DEFAULT 0,
    minimum_stock DECIMAL(10, 4) NOT NULL DEFAULT 0,
    maximum_stock DECIMAL(10, 4) NOT NULL DEFAULT 100,
    last_restocked DATE,
    cost_per_unit DECIMAL(10, 4),
    total_value DECIMAL(12, 2) GENERATED ALWAYS AS (current_stock * cost_per_unit) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(location_id, resource_id)
);

-- =====================================================
-- TABELA ALERTE INVENTAR (Inventory Alerts)
-- =====================================================
CREATE TABLE inventory_alerts (
    alert_id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(inventory_id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED')),
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- =====================================================
-- TABELA COMENZI (Orders)
-- =====================================================
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    location_id INTEGER REFERENCES locations(location_id),
    service_id INTEGER REFERENCES services(service_id),
    assigned_employee_id INTEGER REFERENCES employees(employee_id),
    order_code VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED')),
    priority VARCHAR(10) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    
    -- Detalii serviciu
    item_description TEXT, -- Descrierea obiectului de spălat
    item_type VARCHAR(50), -- Tipul obiectului (covor, mașină, etc.)
    item_condition TEXT, -- Starea inițială
    special_instructions TEXT,
    
    -- Prețuri și costuri
    base_price DECIMAL(10, 2) NOT NULL,
    transport_fee DECIMAL(10, 2) DEFAULT 0.00,
    additional_fees DECIMAL(10, 2) DEFAULT 0.00,
    discount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Programare
    scheduled_date DATE,
    scheduled_time TIME,
    estimated_duration INTEGER, -- în minute
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    
    -- Adrese transport
    pickup_address TEXT,
    delivery_address TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- =====================================================
-- TABELA PROGRAMĂRI RECURENTE (Recurring Schedules)
-- =====================================================
CREATE TABLE recurring_schedules (
    schedule_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    location_id INTEGER REFERENCES locations(location_id),
    service_id INTEGER REFERENCES services(service_id),
    
    -- Configurare recurență
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
    interval_value INTEGER DEFAULT 1, -- La câte unități de timp să se repete
    days_of_week INTEGER[], -- Pentru recurența săptămânală [1,2,3,4,5] = Luni-Vineri
    day_of_month INTEGER, -- Pentru recurența lunară
    
    -- Detalii serviciu
    item_description TEXT,
    special_instructions TEXT,
    pickup_address TEXT,
    delivery_address TEXT,
    
    -- Status și date
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE,
    next_execution DATE,
    last_executed DATE,
    total_executions INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA EVALUĂRI COMENZI (Order Reviews)
-- =====================================================
CREATE TABLE order_reviews (
    review_id SERIAL PRIMARY KEY,
    order_id INTEGER UNIQUE REFERENCES orders(order_id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(customer_id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    service_quality_rating INTEGER CHECK (service_quality_rating >= 1 AND service_quality_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    staff_rating INTEGER CHECK (staff_rating >= 1 AND staff_rating <= 5),
    comment TEXT,
    would_recommend BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA RESURSE UTILIZATE ÎN COMENZI (Order Resources)
-- =====================================================
CREATE TABLE order_resources (
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    resource_id INTEGER REFERENCES resources(resource_id),
    quantity_used DECIMAL(10, 4) NOT NULL,
    cost_per_unit DECIMAL(10, 4) NOT NULL,
    total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (quantity_used * cost_per_unit) STORED,
    recorded_by INTEGER REFERENCES employees(employee_id),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (order_id, resource_id)
);

-- =====================================================
-- TABELA SOLICITĂRI TRANSPORT (Transport Requests)
-- =====================================================
CREATE TABLE transport_requests (
    transport_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('PICKUP', 'DELIVERY', 'BOTH')),
    
    -- Adrese
    pickup_address TEXT,
    pickup_contact_name VARCHAR(100),
    pickup_contact_phone VARCHAR(20),
    pickup_instructions TEXT,
    
    delivery_address TEXT,
    delivery_contact_name VARCHAR(100),
    delivery_contact_phone VARCHAR(20),
    delivery_instructions TEXT,
    
    -- Programare
    scheduled_pickup_date DATE,
    scheduled_pickup_time TIME,
    scheduled_delivery_date DATE,
    scheduled_delivery_time TIME,
    
    -- Execuție
    assigned_driver_id INTEGER REFERENCES employees(employee_id),
    actual_pickup_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    
    -- Status și costuri
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
    transport_fee DECIMAL(10, 2) NOT NULL,
    distance_km DECIMAL(6, 2),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA CONSUM RESURSE (Resource Consumption)
-- =====================================================
CREATE TABLE resource_consumption (
    consumption_id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(location_id),
    resource_id INTEGER REFERENCES resources(resource_id),
    consumption_date DATE NOT NULL,
    quantity_consumed DECIMAL(10, 4) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    recorded_by INTEGER REFERENCES employees(employee_id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA UTILIZARE ECHIPAMENTE (Equipment Usage Logs)
-- =====================================================
CREATE TABLE equipment_usage_logs (
    usage_id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment(equipment_id),
    order_id INTEGER REFERENCES orders(order_id),
    employee_id INTEGER REFERENCES employees(employee_id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_time - start_time))/60) STORED,
    efficiency_rating DECIMAL(3, 2), -- Evaluarea eficienței pentru această utilizare
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA PROGRAMĂRI MENTENANȚĂ (Maintenance Schedules)
-- =====================================================
CREATE TABLE maintenance_schedules (
    maintenance_id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment(equipment_id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('PREVENTIVE', 'CORRECTIVE', 'EMERGENCY')),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    assigned_technician_id INTEGER REFERENCES employees(employee_id),
    
    -- Detalii mentenanță
    description TEXT NOT NULL,
    estimated_duration INTEGER, -- în minute
    estimated_cost DECIMAL(10, 2),
    
    -- Execuție
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    actual_cost DECIMAL(10, 2),
    work_performed TEXT,
    parts_replaced TEXT[],
    
    -- Status
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- =====================================================
-- TABELA CONDIȚII METEO (Weather Conditions)
-- =====================================================
CREATE TABLE weather_conditions (
    weather_id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(location_id),
    date DATE NOT NULL,
    temperature DECIMAL(4, 1), -- în grade Celsius
    humidity INTEGER, -- procent
    precipitation DECIMAL(5, 2), -- mm
    wind_speed DECIMAL(5, 2), -- km/h
    weather_type VARCHAR(50), -- 'SUNNY', 'RAINY', 'CLOUDY', 'STORMY', etc.
    impact_on_operations TEXT, -- Impactul asupra operațiunilor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(location_id, date)
);

-- =====================================================
-- TABELA RAPOARTE EXCEPȚII (Exception Reports)
-- =====================================================
CREATE TABLE exception_reports (
    exception_id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(location_id),
    reported_by INTEGER REFERENCES employees(employee_id),
    type VARCHAR(50) NOT NULL, -- 'POWER_OUTAGE', 'STAFF_UNAVAILABLE', 'EQUIPMENT_FAILURE', etc.
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- Impact
    affected_orders INTEGER[], -- Array cu ID-urile comenzilor afectate
    estimated_downtime INTEGER, -- în minute
    financial_impact DECIMAL(10, 2),
    
    -- Rezolvare
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    resolution TEXT,
    resolved_by INTEGER REFERENCES employees(employee_id),
    resolved_at TIMESTAMP,
    
    -- Notificări
    email_sent BOOLEAN DEFAULT FALSE,
    notification_sent BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA NOTIFICĂRI (Notifications)
-- =====================================================
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    type VARCHAR(50) NOT NULL, -- 'ORDER_UPDATE', 'MAINTENANCE_DUE', 'LOW_STOCK', etc.
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Metadata
    related_entity_type VARCHAR(50), -- 'ORDER', 'EQUIPMENT', 'INVENTORY', etc.
    related_entity_id INTEGER,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_via VARCHAR(20)[], -- ['EMAIL', 'BROWSER', 'SMS']
    
    -- Programare
    scheduled_for TIMESTAMP,
    expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- =====================================================
-- TABELA FLUXURI RSS (RSS Feeds)
-- =====================================================
CREATE TABLE rss_feeds (
    feed_id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(location_id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    category VARCHAR(50), -- 'STATUS', 'ORDERS', 'MAINTENANCE', etc.
    
    -- Metadata RSS
    guid VARCHAR(255) UNIQUE NOT NULL,
    pub_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    author VARCHAR(100),
    
    -- Status
    is_published BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA SCHIMBURI ANGAJAȚI (Employee Shifts)
-- =====================================================
CREATE TABLE employee_shifts (
    shift_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id),
    location_id INTEGER REFERENCES locations(location_id),
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration INTEGER DEFAULT 30, -- în minute
    
    -- Execuție
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    total_hours DECIMAL(4, 2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDECȘI PENTRU PERFORMANȚĂ
-- =====================================================

-- Indecși pentru căutări frecvente
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_location ON orders(location_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(scheduled_date);
CREATE INDEX idx_orders_created ON orders(created_at);

CREATE INDEX idx_equipment_location ON equipment(location_id);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_maintenance ON equipment(next_maintenance);

CREATE INDEX idx_inventory_location ON inventory(location_id);
CREATE INDEX idx_inventory_stock ON inventory(current_stock);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

CREATE INDEX idx_exceptions_location ON exception_reports(location_id);
CREATE INDEX idx_exceptions_status ON exception_reports(status);
CREATE INDEX idx_exceptions_severity ON exception_reports(severity);

-- Indecși pentru RSS
CREATE INDEX idx_rss_location ON rss_feeds(location_id);
CREATE INDEX idx_rss_published ON rss_feeds(is_published, pub_date);

-- =====================================================
-- FUNCȚII ȘI TRIGGERE
-- =====================================================

-- Funcție pentru actualizarea timestamp-ului
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggere pentru actualizarea automată a updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transport_updated_at BEFORE UPDATE ON transport_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funcție pentru generarea codurilor unice
CREATE OR REPLACE FUNCTION generate_unique_code(prefix TEXT, table_name TEXT, column_name TEXT)
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_code := prefix || LPAD(counter::TEXT, 6, '0');
        EXECUTE format('SELECT 1 FROM %I WHERE %I = $1', table_name, column_name) USING new_code;
        IF NOT FOUND THEN
            RETURN new_code;
        END IF;
        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger pentru generarea automată a codurilor
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_code IS NULL THEN
        NEW.order_code := generate_unique_code('ORD', 'orders', 'order_code');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_order_code 
    BEFORE INSERT ON orders 
    FOR EACH ROW EXECUTE FUNCTION generate_order_code();

-- =====================================================
-- COMENTARII PENTRU DOCUMENTAȚIE
-- =====================================================

COMMENT ON TABLE users IS 'Utilizatori sistem - ADMIN, MANAGER, EMPLOYEE, CUSTOMER';
COMMENT ON TABLE locations IS 'Sedii/locații spalatorii cu coordonate GPS';
COMMENT ON TABLE services IS 'Servicii oferite - covoare, mașini, îmbrăcăminte, etc.';
COMMENT ON TABLE equipment IS 'Echipamente cu monitorizare uzură și mentenanță';
COMMENT ON TABLE resources IS 'Resurse/consumabile - detergenti, chimicale, etc.';
COMMENT ON TABLE inventory IS 'Stocuri per locație cu alerte automate';
COMMENT ON TABLE orders IS 'Comenzi cu transport și programare recurentă';
COMMENT ON TABLE recurring_schedules IS 'Programări recurente pentru clienți';
COMMENT ON TABLE weather_conditions IS 'Condiții meteo cu impact asupra operațiunilor';
COMMENT ON TABLE exception_reports IS 'Rapoarte excepții cu notificări email/browser';
COMMENT ON TABLE notifications IS 'Sistem notificări multi-canal';
COMMENT ON TABLE rss_feeds IS 'Fluxuri RSS pentru consultarea stării sediilor';

-- =====================================================
-- FINALIZARE
-- =====================================================

-- Mesaj de confirmare
DO $$
BEGIN
    RAISE NOTICE 'Schema CaS v2.0 creată cu succes!';
    RAISE NOTICE 'Tabele create: %', (
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    );
END $$; 