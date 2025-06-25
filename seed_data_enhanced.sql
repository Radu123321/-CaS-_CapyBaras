/*********************************************************************
* CaS – Cleaning Web Simulator • Enhanced Seed Data v2
* Date complete pentru demonstrație și dezvoltare
* Rulează DUPĂ createschema_enhanced.sql
*
* CREDENȚIALE DEMO:
* admin@cas.ro / admin123 (ADMIN)
* manager@cas.ro / manager123 (MANAGER)  
* employee@cas.ro / employee123 (EMPLOYEE)
* client@cas.ro / client123 (CUSTOMER)
*********************************************************************/

-- Clear existing data (în ordine pentru foreign keys)
DELETE FROM daily_stats;
DELETE FROM alerts;
DELETE FROM weather_snapshots;
DELETE FROM equipment_usage_log;
DELETE FROM equipment_maintenance;
DELETE FROM equipment;
DELETE FROM order_resource_usage;
DELETE FROM transports;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM inventory;
DELETE FROM resources;
DELETE FROM services;
DELETE FROM shifts;
DELETE FROM employees;
DELETE FROM customers;
DELETE FROM user_roles;
DELETE FROM locations;
DELETE FROM users;

-- Reset sequences
ALTER SEQUENCE users_user_id_seq RESTART WITH 1;
ALTER SEQUENCE locations_location_id_seq RESTART WITH 1;
ALTER SEQUENCE customers_customer_id_seq RESTART WITH 1;
ALTER SEQUENCE employees_employee_id_seq RESTART WITH 1;
ALTER SEQUENCE services_service_id_seq RESTART WITH 1;
ALTER SEQUENCE resources_resource_id_seq RESTART WITH 1;
ALTER SEQUENCE orders_order_id_seq RESTART WITH 1;
ALTER SEQUENCE transports_transport_id_seq RESTART WITH 1;
ALTER SEQUENCE equipment_equipment_id_seq RESTART WITH 1;
ALTER SEQUENCE equipment_maintenance_maintenance_id_seq RESTART WITH 1;
ALTER SEQUENCE equipment_usage_log_usage_id_seq RESTART WITH 1;
ALTER SEQUENCE weather_snapshots_snapshot_id_seq RESTART WITH 1;
ALTER SEQUENCE alerts_alert_id_seq RESTART WITH 1;
ALTER SEQUENCE daily_stats_stat_id_seq RESTART WITH 1;

/*********************************************************************
* 1. USERS & CREDENTIALS - CREDENȚIALE DEMO SIMPLE
*********************************************************************/

-- Password hash pentru "admin123", "manager123", "employee123", "client123"
-- Folosim SHA-256 simple pentru demo: SHA256("admin123") etc.

INSERT INTO users (email, password_hash, full_name, default_role) VALUES
-- DEMO CREDENTIALS (PBKDF2 hashes for demo passwords)
('admin@cas.ro', 'zg0KSsPHWRhjP6F8YClEpBmsJe9VhkobBDsgB5eOt//w52pbZ+/RWSMt3epKiTmS', 'Admin Demo', 'ADMIN'),
('manager@cas.ro', '6FBpujSv3AqVzPjwhiCeoXcPITGo1mA8Wg3e9Ieh4117yLpyJWFR3gbBk5NjqS0b', 'Manager Demo', 'MANAGER'),
('employee@cas.ro', 'S9LSVyqF6UZsdX1LFxQJrVjfrKTWgIOqdpaZ5DcVFRnfapDXjdAjkbIJfyT0t9mF', 'Employee Demo', 'EMPLOYEE'),
('client@cas.ro', 'iLfaUH1aiIGa46WqreIdgJ9KDzNUWMsZ6Ida8j9N+/PgFOsSDZkw/sH0H6e9bz64', 'Client Demo', 'CUSTOMER'),

-- Manageri locații (password: manager123)
('ana.popescu@cas.ro', '6FBpujSv3AqVzPjwhiCeoXcPITGo1mA8Wg3e9Ieh4117yLpyJWFR3gbBk5NjqS0b', 'Ana Popescu', 'MANAGER'),
('mihai.ionescu@cas.ro', '6FBpujSv3AqVzPjwhiCeoXcPITGo1mA8Wg3e9Ieh4117yLpyJWFR3gbBk5NjqS0b', 'Mihai Ionescu', 'MANAGER'),
('elena.dumitrescu@cas.ro', '6FBpujSv3AqVzPjwhiCeoXcPITGo1mA8Wg3e9Ieh4117yLpyJWFR3gbBk5NjqS0b', 'Elena Dumitrescu', 'MANAGER'),

-- Angajați (password: employee123)
('maria.stan@cas.ro', 'S9LSVyqF6UZsdX1LFxQJrVjfrKTWgIOqdpaZ5DcVFRnfapDXjdAjkbIJfyT0t9mF', 'Maria Stan', 'EMPLOYEE'),
('ion.vasile@cas.ro', 'S9LSVyqF6UZsdX1LFxQJrVjfrKTWgIOqdpaZ5DcVFRnfapDXjdAjkbIJfyT0t9mF', 'Ion Vasile', 'EMPLOYEE'),
('alexandra.popa@cas.ro', 'S9LSVyqF6UZsdX1LFxQJrVjfrKTWgIOqdpaZ5DcVFRnfapDXjdAjkbIJfyT0t9mF', 'Alexandra Popa', 'EMPLOYEE'),
('radu.marin@cas.ro', 'S9LSVyqF6UZsdX1LFxQJrVjfrKTWgIOqdpaZ5DcVFRnfapDXjdAjkbIJfyT0t9mF', 'Radu Marin', 'EMPLOYEE'),
('cristina.gheorghe@cas.ro', 'S9LSVyqF6UZsdX1LFxQJrVjfrKTWgIOqdpaZ5DcVFRnfapDXjdAjkbIJfyT0t9mF', 'Cristina Gheorghe', 'EMPLOYEE'),

-- Clienți (password: client123)
('gabriel.popescu@gmail.com', 'iLfaUH1aiIGa46WqreIdgJ9KDzNUWMsZ6Ida8j9N+/PgFOsSDZkw/sH0H6e9bz64', 'Gabriel Popescu', 'CUSTOMER'),
('ioana.marinescu@yahoo.com', 'iLfaUH1aiIGa46WqreIdgJ9KDzNUWMsZ6Ida8j9N+/PgFOsSDZkw/sH0H6e9bz64', 'Ioana Marinescu', 'CUSTOMER'),
('adrian.constantinescu@outlook.com', 'iLfaUH1aiIGa46WqreIdgJ9KDzNUWMsZ6Ida8j9N+/PgFOsSDZkw/sH0H6e9bz64', 'Adrian Constantinescu', 'CUSTOMER'),
('daniela.radu@gmail.com', 'iLfaUH1aiIGa46WqreIdgJ9KDzNUWMsZ6Ida8j9N+/PgFOsSDZkw/sH0H6e9bz64', 'Daniela Radu', 'CUSTOMER'),
('florin.nicolaescu@yahoo.com', 'iLfaUH1aiIGa46WqreIdgJ9KDzNUWMsZ6Ida8j9N+/PgFOsSDZkw/sH0H6e9bz64', 'Florin Nicolaescu', 'CUSTOMER');

-- User roles
INSERT INTO user_roles (user_id, role) VALUES
(1, 'ADMIN'), (2, 'MANAGER'), (3, 'EMPLOYEE'), (4, 'CUSTOMER'),
(5, 'MANAGER'), (6, 'MANAGER'), (7, 'MANAGER'),
(8, 'EMPLOYEE'), (9, 'EMPLOYEE'), (10, 'EMPLOYEE'), (11, 'EMPLOYEE'), (12, 'EMPLOYEE'),
(13, 'CUSTOMER'), (14, 'CUSTOMER'), (15, 'CUSTOMER'), (16, 'CUSTOMER'), (17, 'CUSTOMER');

/*********************************************************************
* 2. LOCATIONS (3 sedii în București)
*********************************************************************/

INSERT INTO locations (name, address, latitude, longitude, phone, email, manager_id) VALUES
('CaS Centrul Vechi', 'Strada Lipscani 45, București', 44.4268, 26.1025, '+40 21 123 4567', 'centru@cas.ro', 5),
('CaS Herastrau', 'Șoseaua Nordului 89, București', 44.4991, 26.0889, '+40 21 234 5678', 'nord@cas.ro', 6),
('CaS Dimitrie Cantemir', 'Boulevard Dimitrie Cantemir 125, București', 44.3875, 26.1178, '+40 21 345 6789', 'sud@cas.ro', 7);

/*********************************************************************
* 3. CUSTOMERS & EMPLOYEES & SHIFTS
*********************************************************************/

-- Customers
INSERT INTO customers (user_id, address, phone) VALUES
(4, 'Demo Address, București', '+40 722 000 000'),
(13, 'Strada Amzei 10, București', '+40 722 123 456'),
(14, 'Bulevardul Magheru 25, București', '+40 723 234 567'),
(15, 'Strada Dorobanti 33, București', '+40 724 345 678'),
(16, 'Calea Floreasca 45, București', '+40 725 456 789'),
(17, 'Strada Polona 12, București', '+40 726 567 890');

-- Employees
INSERT INTO employees (user_id, location_id, job_title, hire_date, salary) VALUES
(3, 1, 'Demo Employee', '2024-01-01', 3000.00),
(8, 1, 'Specialist Curățenie Covoare', '2024-01-15', 3000.00),
(9, 1, 'Tehnician Echipamente', '2024-02-01', 3500.00),
(10, 2, 'Specialist Spălare Auto', '2024-03-10', 3200.00),
(11, 2, 'Șofer Transport', '2024-04-05', 2800.00),
(12, 3, 'Specialist Curățenie Textile', '2024-05-20', 3100.00);

-- Shifts (sample pentru această săptămână)
INSERT INTO shifts (employee_id, start_time, end_time) VALUES
(1, '2025-06-25 08:00:00', '2025-06-25 16:00:00'),
(2, '2025-06-25 08:00:00', '2025-06-25 16:00:00'),
(3, '2025-06-25 14:00:00', '2025-06-25 22:00:00'),
(4, '2025-06-25 09:00:00', '2025-06-25 17:00:00'),
(5, '2025-06-25 10:00:00', '2025-06-25 18:00:00'),
(6, '2025-06-25 08:00:00', '2025-06-25 16:00:00');

/*********************************************************************
* 4. SERVICES (pentru toate tipurile)
*********************************************************************/

INSERT INTO services (service_type, description, base_price, duration_minutes) VALUES
-- CARPET services
('CARPET', 'Curățare covoare mici (< 6mp)', 45.00, 60),
('CARPET', 'Curățare covoare mari (> 6mp)', 75.00, 90),
('CARPET', 'Curățare covoare persane premium', 120.00, 120),
('CARPET', 'Tratament antimucegai covoare', 60.00, 75),

-- CAR_WASH services
('CAR_WASH', 'Spălare exterioară standard', 35.00, 30),
('CAR_WASH', 'Spălare completă interior+exterior', 65.00, 75),
('CAR_WASH', 'Detailing premium cu ceruire', 150.00, 180),
('CAR_WASH', 'Curățare tapițerie auto', 85.00, 90),

-- GARMENT services
('GARMENT', 'Curățare chimică costume', 45.00, 120),
('GARMENT', 'Curățare rochii de seară', 55.00, 150),
('GARMENT', 'Spălare haine delicate', 25.00, 90),
('GARMENT', 'Tratament pete dificile', 35.00, 60),

-- OTHER services
('OTHER', 'Curățare mobilier tapițat', 80.00, 120),
('OTHER', 'Dezinfecție profesională', 50.00, 45),
('OTHER', 'Curățare perdele și draperii', 40.00, 90),
('OTHER', 'Servicii de călcat profesional', 20.00, 30);

/*********************************************************************
* 5. RESOURCES (consumabile diverse)
*********************************************************************/

INSERT INTO resources (name, kind, unit, unit_cost, supplier, min_stock) VALUES
-- DETERGENT
('Detergent Universal Concentrat', 'DETERGENT', 'L', 18.50, 'ChemPro SRL', 15.0),
('Detergent Specializat Covoare', 'DETERGENT', 'L', 22.00, 'CarpetClean SA', 12.0),
('Shampoo Auto Profesional', 'DETERGENT', 'L', 16.50, 'AutoChem Ltd', 20.0),
('Detergent Textile Delicat', 'DETERGENT', 'L', 25.00, 'TextileCare SRL', 10.0),
('Dezinfectant Medicinal', 'DETERGENT', 'L', 28.00, 'MedClean Pro', 8.0),

-- BRUSH și unelte
('Perie Rotativă Covoare', 'BRUSH', 'buc', 65.00, 'BrushTech SRL', 4.0),
('Perie Auto Soft', 'BRUSH', 'buc', 35.00, 'AutoTools SA', 6.0),
('Perie Textile Fine', 'BRUSH', 'buc', 45.00, 'TextileTools', 5.0),
('Aspirator Profesional Portabil', 'BRUSH', 'buc', 180.00, 'VacuumPro', 2.0),

-- WATER
('Apă Demineralizată', 'WATER', 'L', 3.20, 'AquaPure Premium', 80.0),
('Soluție de Clătire', 'WATER', 'L', 4.50, 'ChemPro SRL', 60.0),

-- EQUIPMENT consumabile
('Filtre HEPA Aspiratoare', 'EQUIPMENT', 'buc', 35.00, 'FilterTech Pro', 15.0),
('Duze Pulverizare Detergent', 'EQUIPMENT', 'buc', 25.00, 'SprayTech SRL', 10.0),
('Discuri Abrazive Mașini', 'EQUIPMENT', 'buc', 12.00, 'AbrasivePro', 25.0),

-- OTHER
('Lavete Microfibre Premium', 'OTHER', 'buc', 12.00, 'TextilePro', 40.0),
('Mănuși Nitril Profesionale', 'OTHER', 'pereche', 4.50, 'SafetyFirst', 80.0),
('Pungi Protecție Haine', 'OTHER', 'buc', 2.50, 'PackagePro', 100.0),
('Etichete Identificare', 'OTHER', 'buc', 0.25, 'LabelTech', 200.0);

-- Continuă în comentariu pentru a nu depăși limita...
SELECT 'Seed enhanced data created - Part 1 completed! 🎯' as status; 