-- =====================================================
-- CaS Database Seed v2.0 - Part 1
-- Utilizatori, Locații, Angajați, Clienți
-- =====================================================

-- Curățare date existente
TRUNCATE TABLE employee_shifts CASCADE;
TRUNCATE TABLE rss_feeds CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE exception_reports CASCADE;
TRUNCATE TABLE weather_conditions CASCADE;
TRUNCATE TABLE maintenance_schedules CASCADE;
TRUNCATE TABLE equipment_usage_logs CASCADE;
TRUNCATE TABLE resource_consumption CASCADE;
TRUNCATE TABLE inventory_alerts CASCADE;
TRUNCATE TABLE order_resources CASCADE;
TRUNCATE TABLE transport_requests CASCADE;
TRUNCATE TABLE order_reviews CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE recurring_schedules CASCADE;
TRUNCATE TABLE inventory CASCADE;
TRUNCATE TABLE location_services CASCADE;
TRUNCATE TABLE service_resources CASCADE;
TRUNCATE TABLE equipment CASCADE;
TRUNCATE TABLE resources CASCADE;
TRUNCATE TABLE services CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE employees CASCADE;
TRUNCATE TABLE locations CASCADE;
TRUNCATE TABLE users CASCADE;

-- Reset sequences
ALTER SEQUENCE users_user_id_seq RESTART WITH 1;
ALTER SEQUENCE locations_location_id_seq RESTART WITH 1;
ALTER SEQUENCE employees_employee_id_seq RESTART WITH 1;
ALTER SEQUENCE customers_customer_id_seq RESTART WITH 1;

-- =====================================================
-- UTILIZATORI (Users)
-- =====================================================

-- Parole: admin123, manager123, employee123, client123
-- Salt: cas_salt_2024
-- Hash: PBKDF2 cu 310000 iterații, 32 bytes key, SHA256

INSERT INTO users (username, email, password_hash, salt, role, first_name, last_name, phone, is_active) VALUES
-- ADMIN
('admin', 'admin@cas.ro', '88317763a797d9246b2b50c78934f703ae6e9a598b567bf3f543f7ac1a332580', 'cas_salt_2024', 'ADMIN', 'Administrator', 'Sistem', '+40721000001', true),

-- MANAGERI
('manager1', 'manager.centru@cas.ro', '9d682fd209b3b2ed1386bcac02793fae1ec8affb96c68f210c6a6743ed41ed0a', 'cas_salt_2024', 'MANAGER', 'Maria', 'Ionescu', '+40721000002', true),
('manager2', 'manager.nord@cas.ro', '9d682fd209b3b2ed1386bcac02793fae1ec8affb96c68f210c6a6743ed41ed0a', 'cas_salt_2024', 'MANAGER', 'Alexandru', 'Popescu', '+40721000003', true),
('manager3', 'manager.sud@cas.ro', '9d682fd209b3b2ed1386bcac02793fae1ec8affb96c68f210c6a6743ed41ed0a', 'cas_salt_2024', 'MANAGER', 'Elena', 'Georgescu', '+40721000004', true),

-- ANGAJAȚI
('employee1', 'ion.vasile@cas.ro', 'a84ac860c13713d0158c8d4fd088ae57f3af86e63a8692269517a84305e66ea0', 'cas_salt_2024', 'EMPLOYEE', 'Ion', 'Vasile', '+40721000005', true),
('employee2', 'ana.marin@cas.ro', 'a84ac860c13713d0158c8d4fd088ae57f3af86e63a8692269517a84305e66ea0', 'cas_salt_2024', 'EMPLOYEE', 'Ana', 'Marin', '+40721000006', true),
('employee3', 'mihai.stan@cas.ro', 'a84ac860c13713d0158c8d4fd088ae57f3af86e63a8692269517a84305e66ea0', 'cas_salt_2024', 'EMPLOYEE', 'Mihai', 'Stan', '+40721000007', true),
('employee4', 'cristina.radu@cas.ro', 'a84ac860c13713d0158c8d4fd088ae57f3af86e63a8692269517a84305e66ea0', 'cas_salt_2024', 'EMPLOYEE', 'Cristina', 'Radu', '+40721000008', true),
('employee5', 'george.nicu@cas.ro', 'a84ac860c13713d0158c8d4fd088ae57f3af86e63a8692269517a84305e66ea0', 'cas_salt_2024', 'EMPLOYEE', 'George', 'Nicu', '+40721000009', true),
('employee6', 'diana.pavel@cas.ro', 'a84ac860c13713d0158c8d4fd088ae57f3af86e63a8692269517a84305e66ea0', 'cas_salt_2024', 'EMPLOYEE', 'Diana', 'Pavel', '+40721000010', true),

-- CLIENȚI
('client1', 'client@cas.ro', '1525242866dc5e9e75b69f7c53f728fa4697a1f62ad50cefe9007d74a346ba8c', 'cas_salt_2024', 'CUSTOMER', 'Demo', 'Client', '+40721000011', true),
('andrei.popescu', 'andrei.popescu@email.com', '1525242866dc5e9e75b69f7c53f728fa4697a1f62ad50cefe9007d74a346ba8c', 'cas_salt_2024', 'CUSTOMER', 'Andrei', 'Popescu', '+40721000012', true),
('maria.ionescu', 'maria.ionescu@email.com', '1525242866dc5e9e75b69f7c53f728fa4697a1f62ad50cefe9007d74a346ba8c', 'cas_salt_2024', 'CUSTOMER', 'Maria', 'Ionescu', '+40721000013', true),
('alex.georgescu', 'alex.georgescu@email.com', '1525242866dc5e9e75b69f7c53f728fa4697a1f62ad50cefe9007d74a346ba8c', 'cas_salt_2024', 'CUSTOMER', 'Alexandru', 'Georgescu', '+40721000014', true),
('elena.marin', 'elena.marin@email.com', '1525242866dc5e9e75b69f7c53f728fa4697a1f62ad50cefe9007d74a346ba8c', 'cas_salt_2024', 'CUSTOMER', 'Elena', 'Marin', '+40721000015', true),
('cristian.radu', 'cristian.radu@email.com', '1525242866dc5e9e75b69f7c53f728fa4697a1f62ad50cefe9007d74a346ba8c', 'cas_salt_2024', 'CUSTOMER', 'Cristian', 'Radu', '+40721000016', true),
('ana.stan', 'ana.stan@email.com', '1525242866dc5e9e75b69f7c53f728fa4697a1f62ad50cefe9007d74a346ba8c', 'cas_salt_2024', 'CUSTOMER', 'Ana', 'Stan', '+40721000017', true),
('mihai.pavel', 'mihai.pavel@email.com', '1525242866dc5e9e75b69f7c53f728fa4697a1f62ad50cefe9007d74a346ba8c', 'cas_salt_2024', 'CUSTOMER', 'Mihai', 'Pavel', '+40721000018', true),

-- CLIENȚI CORPORATIVI
('office.clean', 'contact@officeclean.ro', '1525242866dc5e9e75b69f7c53f728fa4697a1f62ad50cefe9007d74a346ba8c', 'cas_salt_2024', 'CUSTOMER', 'Office', 'Clean SRL', '+40721000019', true),
('auto.service', 'contact@autoservice.ro', '1525242866dc5e9e75b69f7c53f728fa4697a1f62ad50cefe9007d74a346ba8c', 'cas_salt_2024', 'CUSTOMER', 'Auto', 'Service SA', '+40721000020', true);

-- =====================================================
-- LOCAȚII (Locations)
-- =====================================================

INSERT INTO locations (name, address, city, postal_code, latitude, longitude, phone, email, manager_id, operating_hours, capacity, is_active) VALUES
('CaS Centrul Vechi', 'Strada Lipscani nr. 15, Sector 3', 'București', '030167', 44.4268, 26.1025, '+40213000001', 'centru@cas.ro', 2, 
'{"monday": {"open": "08:00", "close": "20:00"}, "tuesday": {"open": "08:00", "close": "20:00"}, "wednesday": {"open": "08:00", "close": "20:00"}, "thursday": {"open": "08:00", "close": "20:00"}, "friday": {"open": "08:00", "close": "20:00"}, "saturday": {"open": "09:00", "close": "18:00"}, "sunday": {"open": "10:00", "close": "16:00"}}', 15, true),

('CaS Herastrau', 'Șoseaua Nordului nr. 45, Sector 1', 'București', '011464', 44.4825, 26.0831, '+40213000002', 'nord@cas.ro', 3, 
'{"monday": {"open": "07:30", "close": "19:30"}, "tuesday": {"open": "07:30", "close": "19:30"}, "wednesday": {"open": "07:30", "close": "19:30"}, "thursday": {"open": "07:30", "close": "19:30"}, "friday": {"open": "07:30", "close": "19:30"}, "saturday": {"open": "08:30", "close": "17:30"}, "sunday": {"open": "09:30", "close": "15:30"}}', 20, true),

('CaS Berceni', 'Strada Drumul Gazarului nr. 2-4, Sector 4', 'București', '041917', 44.3684, 26.1158, '+40213000003', 'sud@cas.ro', 4, 
'{"monday": {"open": "08:00", "close": "18:00"}, "tuesday": {"open": "08:00", "close": "18:00"}, "wednesday": {"open": "08:00", "close": "18:00"}, "thursday": {"open": "08:00", "close": "18:00"}, "friday": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "17:00"}, "sunday": {"closed": true}}', 12, true);

-- =====================================================
-- ANGAJAȚI (Employees)
-- =====================================================

INSERT INTO employees (user_id, location_id, employee_code, position, hourly_rate, hire_date, is_available, skills) VALUES
-- Angajați Centrul Vechi
(5, 1, 'EMP001', 'Specialist Curățenie Covoare', 25.50, '2023-03-15', true, ARRAY['CARPET', 'UPHOLSTERY']),
(6, 1, 'EMP002', 'Specialist Spălare Auto', 28.00, '2023-05-20', true, ARRAY['CAR_WASH', 'DETAILING']),

-- Angajați Herastrau
(7, 2, 'EMP003', 'Specialist Curățenie Textile', 26.75, '2023-01-10', true, ARRAY['GARMENT', 'CARPET']),
(8, 2, 'EMP004', 'Specialist Spălare Auto Premium', 32.00, '2023-02-14', true, ARRAY['CAR_WASH', 'DETAILING', 'PREMIUM']),

-- Angajați Berceni
(9, 3, 'EMP005', 'Specialist Curățenie Generală', 24.00, '2023-06-01', true, ARRAY['CARPET', 'GARMENT', 'OTHER']),
(10, 3, 'EMP006', 'Șofer și Specialist Transport', 27.50, '2023-04-18', true, ARRAY['TRANSPORT', 'CAR_WASH']);

-- =====================================================
-- CLIENȚI (Customers)
-- =====================================================

INSERT INTO customers (user_id, customer_code, company_name, billing_address, preferred_location_id, loyalty_points, total_orders, total_spent, preferred_contact_method) VALUES
-- Client demo
(11, 'CUST001', NULL, 'Strada Demo nr. 1, București', 1, 150, 5, 750.00, 'EMAIL'),

-- Clienți individuali
(12, 'CUST002', NULL, 'Strada Victoriei nr. 120, Sector 1, București', 2, 320, 12, 1850.00, 'EMAIL'),
(13, 'CUST003', NULL, 'Calea Vitan nr. 55, Sector 3, București', 1, 180, 7, 980.00, 'PHONE'),
(14, 'CUST004', NULL, 'Bulevardul Unirii nr. 78, Sector 4, București', 3, 95, 3, 450.00, 'EMAIL'),
(15, 'CUST005', NULL, 'Strada Amzei nr. 25, Sector 1, București', 2, 240, 9, 1320.00, 'SMS'),
(16, 'CUST006', NULL, 'Strada Mihai Bravu nr. 89, Sector 2, București', 1, 75, 2, 290.00, 'EMAIL'),
(17, 'CUST007', NULL, 'Calea Floreasca nr. 167, Sector 1, București', 2, 410, 15, 2100.00, 'EMAIL'),
(18, 'CUST008', NULL, 'Strada Splaiul Unirii nr. 12, Sector 4, București', 3, 125, 4, 620.00, 'PHONE'),

-- Clienți corporativi
(19, 'CORP001', 'Office Clean SRL', 'Strada Aviatorilor nr. 40, Sector 1, București', 2, 850, 25, 8500.00, 'EMAIL'),
(20, 'CORP002', 'Auto Service SA', 'Șoseaua Colentina nr. 425, Sector 2, București', 1, 650, 18, 6200.00, 'EMAIL');

-- =====================================================
-- ACTUALIZARE LAST LOGIN
-- =====================================================

UPDATE users SET last_login = CURRENT_TIMESTAMP - INTERVAL '2 hours' WHERE role = 'ADMIN';
UPDATE users SET last_login = CURRENT_TIMESTAMP - INTERVAL '1 day' WHERE role = 'MANAGER';
UPDATE users SET last_login = CURRENT_TIMESTAMP - INTERVAL '3 hours' WHERE role = 'EMPLOYEE';
UPDATE users SET last_login = CURRENT_TIMESTAMP - INTERVAL '1 week' WHERE role = 'CUSTOMER';

-- =====================================================
-- VERIFICARE INSERĂRI
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Seed Part 1 completat cu succes!';
    RAISE NOTICE 'Utilizatori creați: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Locații create: %', (SELECT COUNT(*) FROM locations);
    RAISE NOTICE 'Angajați creați: %', (SELECT COUNT(*) FROM employees);
    RAISE NOTICE 'Clienți creați: %', (SELECT COUNT(*) FROM customers);
END $$; 