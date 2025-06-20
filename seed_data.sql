/*********************************************************************
* CaS – Cleaning Web Simulator • Seed Data
* Date de test pentru dezvoltare și demonstrație
* Rulează DUPĂ createschema.sql
*********************************************************************/

-- Clear existing data (în ordine pentru foreign keys)
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

/*********************************************************************
* 1. USERS & ROLES
*********************************************************************/

-- Admin users
INSERT INTO users (email, password_hash, full_name, default_role) VALUES
('admin@cas-system.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IQBF4f4cWb6pKpkCN6.f.PYf6E7Gu.', 'System Administrator', 'ADMIN'),
('manager@cas-system.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IQBF4f4cWb6pKpkCN6.f.PYf6E7Gu.', 'General Manager', 'MANAGER');

-- Location managers
INSERT INTO users (email, password_hash, full_name, default_role) VALUES
('manager.centru@cas-system.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IQBF4f4cWb6pKpkCN6.f.PYf6E7Gu.', 'Ana Popescu', 'MANAGER'),
('manager.nord@cas-system.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IQBF4f4cWb6pKpkCN6.f.PYf6E7Gu.', 'Mihai Ionescu', 'MANAGER'),
('manager.sud@cas-system.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IQBF4f4cWb6pKpkCN6.f.PYf6E7Gu.', 'Elena Dumitrescu', 'MANAGER');

-- Employees
INSERT INTO users (email, password_hash, full_name, default_role) VALUES
('maria.stan@cas-system.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IQBF4f4cWb6pKpkCN6.f.PYf6E7Gu.', 'Maria Stan', 'EMPLOYEE'),
('ion.vasile@cas-system.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IQBF4f4cWb6pKpkCN6.f.PYf6E7Gu.', 'Ion Vasile', 'EMPLOYEE'),
('alexandra.popa@cas-system.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IQBF4f4cWb6pKpkCN6.f.PYf6E7Gu.', 'Alexandra Popa', 'EMPLOYEE'),
('radu.marin@cas-system.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IQBF4f4cWb6pKpkCN6.f.PYf6E7Gu.', 'Radu Marin', 'EMPLOYEE'),
('cristina.gheorghe@cas-system.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IQBF4f4cWb6pKpkCN6.f.PYf6E7Gu.', 'Cristina Gheorghe', 'EMPLOYEE'),
('andrei.stoica@cas-system.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IQBF4f4cWb6pKpkCN6.f.PYf6E7Gu.', 'Andrei Stoica', 'EMPLOYEE');

-- Customers
INSERT INTO users (email, password_hash, full_name, default_role) VALUES
('client1@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IQBF4f4cWb6pKpkCN6.f.PYf6E7Gu.', 'Gabriel Popescu', 'CUSTOMER'),
('client2@yahoo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IQBF4f4cWb6pKpkCN6.f.PYf6E7Gu.', 'Ioana Marinescu', 'CUSTOMER'),
('client3@outlook.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IQBF4f4cWb6pKpkCN6.f.PYf6E7Gu.', 'Adrian Constantinescu', 'CUSTOMER'),
('client4@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IQBF4f4cWb6pKpkCN6.f.PYf6E7Gu.', 'Daniela Radu', 'CUSTOMER'),
('client5@yahoo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1IQBF4f4cWb6pKpkCN6.f.PYf6E7Gu.', 'Florin Nicolaescu', 'CUSTOMER');

-- User roles
INSERT INTO user_roles (user_id, role) VALUES
(1, 'ADMIN'), (2, 'MANAGER'),
(3, 'MANAGER'), (4, 'MANAGER'), (5, 'MANAGER'),
(6, 'EMPLOYEE'), (7, 'EMPLOYEE'), (8, 'EMPLOYEE'), (9, 'EMPLOYEE'), (10, 'EMPLOYEE'), (11, 'EMPLOYEE'),
(12, 'CUSTOMER'), (13, 'CUSTOMER'), (14, 'CUSTOMER'), (15, 'CUSTOMER'), (16, 'CUSTOMER');

/*********************************************************************
* 2. LOCATIONS
*********************************************************************/

INSERT INTO locations (name, address, latitude, longitude, phone, email, manager_id) VALUES
('CaS Centru', 'Strada Victoriei 15, București', 44.4268, 26.1025, '+40 21 123 4567', 'centru@cas-system.com', 3),
('CaS Nord', 'Bulevardul Aviatorilor 42, București', 44.4991, 26.0889, '+40 21 234 5678', 'nord@cas-system.com', 4),
('CaS Sud', 'Calea Văcărești 89, București', 44.3875, 26.1178, '+40 21 345 6789', 'sud@cas-system.com', 5);

/*********************************************************************
* 3. CUSTOMERS & EMPLOYEES
*********************************************************************/

-- Customers
INSERT INTO customers (user_id, address, phone) VALUES
(12, 'Strada Amzei 10, București', '+40 722 123 456'),
(13, 'Bulevardul Magheru 25, București', '+40 723 234 567'),
(14, 'Strada Dorobanti 33, București', '+40 724 345 678'),
(15, 'Calea Floreasca 45, București', '+40 725 456 789'),
(16, 'Strada Polona 12, București', '+40 726 567 890');

-- Employees
INSERT INTO employees (user_id, location_id, job_title, hire_date, salary) VALUES
(6, 1, 'Specialist Curățenie', '2023-01-15', 3000.00),
(7, 1, 'Tehnician Echipamente', '2023-02-01', 3500.00),
(8, 2, 'Specialist Curățenie', '2023-03-10', 3000.00),
(9, 2, 'Șofer Transport', '2023-04-05', 2800.00),
(10, 3, 'Specialist Curățenie', '2023-05-20', 3000.00),
(11, 3, 'Tehnician Echipamente', '2023-06-15', 3500.00);

/*********************************************************************
* 4. SERVICES
*********************************************************************/

INSERT INTO services (service_type, description, base_price, duration_minutes) VALUES
('CARPET', 'Curățare covoare și mochete', 50.00, 90),
('CARPET', 'Curățare covoare persane', 80.00, 120),
('CAR_WASH', 'Spălare auto exterioară', 30.00, 45),
('CAR_WASH', 'Spălare auto completă (interior + exterior)', 60.00, 90),
('GARMENT', 'Curățare haine delicate', 25.00, 60),
('GARMENT', 'Curățare costume și rochii', 40.00, 90),
('OTHER', 'Curățare mobilier tapițat', 70.00, 120),
('OTHER', 'Dezinfecție și igienizare', 45.00, 60);

/*********************************************************************
* 5. RESOURCES
*********************************************************************/

INSERT INTO resources (name, kind, unit, unit_cost, supplier, min_stock) VALUES
-- Detergents
('Detergent Universal', 'DETERGENT', 'L', 15.50, 'ChemClean SRL', 20.0),
('Detergent Covoare', 'DETERGENT', 'L', 18.00, 'ChemClean SRL', 15.0),
('Detergent Auto', 'DETERGENT', 'L', 12.00, 'AutoChem SA', 25.0),
('Dezinfectant', 'DETERGENT', 'L', 22.00, 'MedClean SRL', 10.0),

-- Brushes & Tools
('Perie Covoare', 'BRUSH', 'buc', 45.00, 'ToolSupply SRL', 5.0),
('Perie Auto', 'BRUSH', 'buc', 35.00, 'AutoTools SA', 8.0),
('Aspirator Manual', 'BRUSH', 'buc', 120.00, 'ToolSupply SRL', 3.0),

-- Water
('Apă Distilată', 'WATER', 'L', 2.50, 'AquaPure SRL', 100.0),

-- Equipment consumables
('Filtre Aspirator', 'EQUIPMENT', 'buc', 25.00, 'FilterTech SRL', 20.0),
('Rezervor Detergent', 'EQUIPMENT', 'buc', 85.00, 'EquipParts SA', 5.0),

-- Other
('Lavete Microfibre', 'OTHER', 'buc', 8.00, 'TextilClean SRL', 50.0),
('Mănuși Protecție', 'OTHER', 'pereche', 3.50, 'SafetyFirst SRL', 100.0);

/*********************************************************************
* 6. INVENTORY (cu stocuri low pentru teste)
*********************************************************************/

INSERT INTO inventory (location_id, resource_id, quantity, last_restock) VALUES
-- CaS Centru
(1, 1, 45.5, '2025-06-15 10:00:00'),   -- Detergent Universal
(1, 2, 32.0, '2025-06-15 10:00:00'),   -- Detergent Covoare
(1, 3, 28.5, '2025-06-15 10:00:00'),   -- Detergent Auto
(1, 4, 18.0, '2025-06-15 10:00:00'),   -- Dezinfectant
(1, 5, 8.0, '2025-06-10 14:30:00'),    -- Perie Covoare
(1, 6, 12.0, '2025-06-10 14:30:00'),   -- Perie Auto
(1, 7, 4.0, '2025-06-01 09:00:00'),    -- Aspirator Manual
(1, 8, 150.0, '2025-06-18 08:00:00'),  -- Apă Distilată
(1, 9, 25.0, '2025-06-12 16:00:00'),   -- Filtre Aspirator
(1, 10, 8.0, '2025-06-05 11:00:00'),   -- Rezervor Detergent
(1, 11, 75.0, '2025-06-17 13:00:00'),  -- Lavete Microfibre
(1, 12, 120.0, '2025-06-17 13:00:00'), -- Mănuși Protecție

-- CaS Nord (stoc mai mic pentru a testa alertele)
(2, 1, 8.5, '2025-06-10 10:00:00'),    -- Detergent Universal (LOW STOCK)
(2, 2, 12.0, '2025-06-10 10:00:00'),   -- Detergent Covoare
(2, 3, 0.0, '2025-06-05 10:00:00'),    -- Detergent Auto (OUT OF STOCK)
(2, 4, 5.0, '2025-06-10 10:00:00'),    -- Dezinfectant (CRITICAL)
(2, 5, 3.0, '2025-06-08 14:30:00'),    -- Perie Covoare (CRITICAL)
(2, 6, 6.0, '2025-06-08 14:30:00'),    -- Perie Auto
(2, 8, 85.0, '2025-06-15 08:00:00'),   -- Apă Distilată
(2, 11, 45.0, '2025-06-14 13:00:00'),  -- Lavete Microfibre
(2, 12, 80.0, '2025-06-14 13:00:00'),  -- Mănuși Protecție

-- CaS Sud
(3, 1, 38.0, '2025-06-16 10:00:00'),   -- Detergent Universal
(3, 2, 25.0, '2025-06-16 10:00:00'),   -- Detergent Covoare
(3, 3, 22.0, '2025-06-16 10:00:00'),   -- Detergent Auto
(3, 4, 15.0, '2025-06-16 10:00:00'),   -- Dezinfectant
(3, 5, 6.0, '2025-06-12 14:30:00'),    -- Perie Covoare
(3, 6, 9.0, '2025-06-12 14:30:00'),    -- Perie Auto
(3, 7, 2.0, '2025-06-03 09:00:00'),    -- Aspirator Manual (CRITICAL)
(3, 8, 120.0, '2025-06-17 08:00:00'),  -- Apă Distilată
(3, 9, 18.0, '2025-06-13 16:00:00'),   -- Filtre Aspirator
(3, 11, 60.0, '2025-06-16 13:00:00'),  -- Lavete Microfibre
(3, 12, 95.0, '2025-06-16 13:00:00');  -- Mănuși Protecție

-- Success message
SELECT 'Seed data inserted successfully! 🎉' as message; 