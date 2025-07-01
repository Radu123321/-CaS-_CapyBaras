-- =============================================
-- CaS v3 – DEMO SEED DATA
-- Apply AFTER running createschema_v3.sql
-- psql -U cas -d cas -f seed_v3.sql
-- =============================================

-- Require pgcrypto for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------
-- 1. Branches
-- ---------------------------------------------
INSERT INTO branches (id, name, address, city, lat, lon, timezone, phone, created_by)
VALUES
  (1, 'Main HQ', 'Str. Fabricii 1', 'Cluj-Napoca', 46.7712, 23.6236, 'Europe/Bucharest', '+40-700-111-111', 1),
  (2, 'West Point', 'Bd. Vestului 99', 'Oradea', 47.0722, 21.9211, 'Europe/Bucharest', '+40-700-222-222', 1);
SELECT setval('branches_id_seq', 2, true);

-- ---------------------------------------------
-- 2. Users
-- (Passwords are fake SHA256 hashes of role names)
-- ---------------------------------------------
INSERT INTO users (id, email, pwd_hash, role, branch_id, first_name, last_name, phone, approved)
VALUES
  (1, 'admin@cas.local',    encode(digest('admin123','sha256'),'hex'),  'ADMIN',    NULL, 'Ada',   'Min', '+40-701-000-001', true),
  (2, 'manager@cas.local',  encode(digest('manager123','sha256'),'hex'),'MANAGER',  1,    'Mara',  'Nager', '+40-701-000-002', true),
  (3, 'emp1@cas.local',     encode(digest('emp123','sha256'),'hex'),    'EMPLOYEE', 1,    'Emil',  'Ployee', '+40-701-000-003', true),
  (4, 'cust1@cas.local',    encode(digest('cust123','sha256'),'hex'),   'CUSTOMER', NULL, 'Caty',  'Ust', '+40-701-000-004', true),
  (5, 'emp2@cas.local',     encode(digest('emp223','sha256'),'hex'),'EMPLOYEE', 2,    'Ema',   'Pl2', '+40-701-000-005', true);
SELECT setval('users_id_seq', 5, true);

-- Employee profiles
INSERT INTO employees_profiles (employee_id, staff_role, hourly_rate, hire_date)
VALUES (3, 'WASHER', 25, CURRENT_DATE - 365),
       (5, 'DRIVER', 28, CURRENT_DATE - 200);

-- ---------------------------------------------
-- 3. Consumables & Inventory
-- ---------------------------------------------
INSERT INTO consumable_items (code, name, unit_code, shelf_life_d)
VALUES ('SOAP', 'Detergent lichid', 'ml', 365)
ON CONFLICT DO NOTHING;

-- Initial stock rows
INSERT INTO inventory_stocks (id, branch_id, item_code, qty_on_hand, min_qty, expire_date)
VALUES (1, 1, 'SOAP', 0, 500, CURRENT_DATE + 180);
SELECT setval('inventory_stocks_id_seq', 1, true);

-- Restock transaction (+2000 ml)
INSERT INTO inventory_transactions (stock_id, qty_delta, reason_code, created_by)
VALUES (1, 2000, 'RESTOCK', 2);

-- ======= NEW: ensure equipment_types exists BEFORE equipment =======
INSERT INTO equipment_types (code, description, default_usage_unit) VALUES
  ('PRESSURE', 'Aparat de spălat cu presiune', 'h')
ON CONFLICT DO NOTHING;
-- ==================================================================

-- ---------------------------------------------
-- 4. Equipment & Maintenance
-- ---------------------------------------------
INSERT INTO equipment (id, branch_id, type_code, name, model, serial_no, purchase_date, status)
VALUES (1, 1, 'PRESSURE', 'Kärcher HD', 'HD-5/15', 'SN12345', CURRENT_DATE - 400, 'OPERATIONAL');
SELECT setval('equipment_id_seq', 1, true);

INSERT INTO maintenance_tasks (id, equipment_id, due_at, task_desc, status)
VALUES (1, 1, CURRENT_TIMESTAMP + interval '7 days', 'Oil change', 'PENDING');
SELECT setval('maintenance_tasks_id_seq', 1, true);

-- ---------------------------------------------
-- 5. Services & Requirements
-- ---------------------------------------------
INSERT INTO service_categories (code, description) VALUES ('WASH', 'Spălare')
ON CONFLICT DO NOTHING;

INSERT INTO services (id, category_code, name, description, base_price, avg_duration_min)
VALUES (1, 'WASH', 'Basic Exterior Wash', 'High-pressure rinse and soap', 40, 20);
SELECT setval('services_id_seq', 1, true);

INSERT INTO services_requirements (service_id, resource_type, resource_code, qty_needed, unit_code)
VALUES (1, 'CONSUMABLE', 'SOAP', 50, 'ml');

-- ---------------------------------------------
-- 6. Orders & Logistics
-- ---------------------------------------------
-- New order for customer
INSERT INTO orders (id, customer_id, branch_id, status, scheduled_start, total_price, notes)
VALUES (1, 4, 1, 'NEW', CURRENT_TIMESTAMP + interval '2 hours', 40, 'Pickup at 5pm');
SELECT setval('orders_id_seq', 1, true);

INSERT INTO order_items (order_id, seq_no, service_id, qty, price_unit, price_total)
VALUES (1, 1, 1, 1, 40, 40);

INSERT INTO order_assignments (order_id, employee_id, role_code)
VALUES (1, 3, 'WASHER');

-- Route for order
INSERT INTO routes (id, order_id, type, driver_id, vehicle, status)
VALUES (1, 1, 'PICKUP', 5, 'Van 1', 'PLANNED');
SELECT setval('routes_id_seq', 1, true);

-- ---------------------------------------------
-- 7. Shifts
-- ---------------------------------------------
INSERT INTO shifts (id, employee_id, branch_id, shift_role_code, start_ts)
VALUES (1, 3, 1, 'WASHER', CURRENT_TIMESTAMP - interval '1 hour');
SELECT setval('shifts_id_seq', 1, true);

-- ---------------------------------------------
-- 8. Weather snapshot
-- ---------------------------------------------
INSERT INTO weather_conditions (id, branch_id, weather_type, temperature, humidity, wind_speed, precipitation, date)
VALUES (1, 1, 'NORMAL', 23, 40, 5, 0, CURRENT_DATE);
SELECT setval('weather_conditions_id_seq', 1, true);

-- ---------------------------------------------
-- 9. Recurring order example
-- ---------------------------------------------
INSERT INTO recurring_orders (id, customer_id, branch_id, base_service_list, rrule, next_occurrence)
VALUES (1, 4, 1, '[{"service_id":1,"qty":1}]', 'FREQ=WEEKLY;BYDAY=FR', CURRENT_TIMESTAMP + interval '7 days');
SELECT setval('recurring_orders_id_seq', 1, true);

-- ---------------------------------------------
-- 10. Additional catalog entries (for FK integrity)
-- ---------------------------------------------
INSERT INTO consumable_items (code, name, unit_code, shelf_life_d) VALUES
  ('SHAMPOO', 'Șampon auto', 'ml', 365)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------
-- 11. Extra Inventory & Transactions (test composite unique & trigger)
-- ---------------------------------------------
-- Branch 1 gets second batch of SOAP with diferent expiry date (allowed)
INSERT INTO inventory_stocks (branch_id, item_code, qty_on_hand, min_qty, expire_date)
VALUES (1, 'SOAP', 0, 500, CURRENT_DATE + 365);

-- Branch 2 stock rows
INSERT INTO inventory_stocks (branch_id, item_code, qty_on_hand, min_qty)
VALUES (2, 'SHAMPOO', 0, 1000);

-- Restock transactions
INSERT INTO inventory_transactions (stock_id, qty_delta, reason_code, created_by)
SELECT id, 1500, 'RESTOCK', 2 FROM inventory_stocks WHERE branch_id=1 AND item_code='SOAP' AND expire_date = CURRENT_DATE + 365;
INSERT INTO inventory_transactions (stock_id, qty_delta, reason_code, created_by)
SELECT id, 3000, 'RESTOCK', 2 FROM inventory_stocks WHERE branch_id=2 AND item_code='SHAMPOO';

-- Consume some resources via ORDER reason
INSERT INTO inventory_transactions (stock_id, qty_delta, reason_code, created_by)
SELECT id, -50, 'ORDER', 3 FROM inventory_stocks WHERE id = 1; -- use first SOAP batch

-- ---------------------------------------------
-- 12. More Equipment & Maintenance statuses
-- ---------------------------------------------
INSERT INTO equipment (branch_id, type_code, name, status)
VALUES (1, 'PRESSURE', 'Kärcher K4', 'MAINTENANCE'),
       (2, 'PRESSURE', 'Bosch EasyAquatak', 'BROKEN'),
       (2, 'PRESSURE', 'Nilfisk C120', 'RETIRED');

-- Maintenance tasks for various statuses
INSERT INTO maintenance_tasks (equipment_id, due_at, task_desc, status, completed_at)
VALUES ((SELECT id FROM equipment WHERE name='Kärcher K4'), CURRENT_TIMESTAMP - interval '1 day', 'Change nozzle', 'COMPLETED', CURRENT_TIMESTAMP - interval '1 day'),
       ((SELECT id FROM equipment WHERE name='Bosch EasyAquatak'), CURRENT_TIMESTAMP + interval '3 days', 'Motor check', 'PENDING', NULL),
       ((SELECT id FROM equipment WHERE name='Nilfisk C120'), CURRENT_TIMESTAMP + interval '5 days', 'Recycle', 'CANCELLED', NULL);

-- ---------------------------------------------
-- 13. Additional Services & Requirements
-- ---------------------------------------------
INSERT INTO service_categories (code, description) VALUES ('DETAIL', 'Detailing')
ON CONFLICT DO NOTHING;

INSERT INTO services (category_code, name, description, base_price, avg_duration_min)
VALUES ('DETAIL', 'Interior Vacuum', 'Full interior vacuum clean', 60, 30);

-- multi-resource requirement
INSERT INTO services_requirements (service_id, resource_type, resource_code, qty_needed, unit_code) VALUES
  ((SELECT id FROM services WHERE name='Interior Vacuum'), 'CONSUMABLE', 'SHAMPOO', 30, 'ml'),
  ((SELECT id FROM services WHERE name='Interior Vacuum'), 'STAFF', 'WASHER', 1, 'h');

-- ---------------------------------------------
-- 14. More Users & Orders to cover all order statuses
-- ---------------------------------------------
-- extra customer
INSERT INTO users (email, pwd_hash, role, first_name, last_name) VALUES
  ('cust2@cas.local', encode(digest('cust223','sha256'),'hex'), 'CUSTOMER', 'Cos', 'Tomer');

-- Orders with each status
INSERT INTO orders (customer_id, branch_id, status, scheduled_start, total_price) VALUES
  ( (SELECT id FROM users WHERE email='cust2@cas.local'), 1, 'SCHEDULED', CURRENT_TIMESTAMP + interval '1 day', 60),
  (4, 1, 'IN_PROGRESS', CURRENT_TIMESTAMP - interval '30 min', 40),
  (4, 1, 'COMPLETED', CURRENT_TIMESTAMP - interval '3 hours', 40),
  (4, 2, 'CANCELLED', CURRENT_TIMESTAMP + interval '5 hours', 40);

-- ensure seq sync
SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));

-- Add items to new orders
INSERT INTO order_items (order_id, seq_no, service_id, qty, price_unit, price_total)
SELECT id, 1, 1, 1, 40, 40 FROM orders WHERE status IN ('IN_PROGRESS','COMPLETED','CANCELLED');

-- ---------------------------------------------
-- 15. Routes with all statuses
-- ---------------------------------------------
INSERT INTO routes (order_id, type, status) VALUES
  ( (SELECT id FROM orders WHERE status='SCHEDULED' LIMIT 1), 'PICKUP', 'PLANNED'),
  ( (SELECT id FROM orders WHERE status='IN_PROGRESS' LIMIT 1), 'DELIVERY', 'ON_ROUTE'),
  ( (SELECT id FROM orders WHERE status='COMPLETED' LIMIT 1), 'DELIVERY', 'DONE');

-- ---------------------------------------------
-- 16. Shifts finished / active per branch
-- ---------------------------------------------
-- end existing shift
UPDATE shifts SET end_ts = CURRENT_TIMESTAMP WHERE id = 1;

-- new active shift at branch 2
INSERT INTO shifts (employee_id, branch_id, shift_role_code, start_ts)
VALUES (5, 2, 'DRIVER', CURRENT_TIMESTAMP - interval '2 hours');

SELECT setval('shifts_id_seq', (SELECT MAX(id) FROM shifts));

-- ---------------------------------------------
-- 17. Weather extremes (adverse)
-- ---------------------------------------------
INSERT INTO weather_conditions (branch_id, weather_type, temperature, humidity, wind_speed, precipitation, date)
VALUES (1, 'STORM', 18, 85, 25, 12, CURRENT_DATE - 1);

-- ---------------------------------------------
-- 18. Recurring order inactive
-- ---------------------------------------------
INSERT INTO recurring_orders (customer_id, branch_id, base_service_list, rrule, next_occurrence, active)
VALUES (4, 1, '[{"service_id":1,"qty":1}]', 'FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=1', CURRENT_TIMESTAMP + interval '30 days', false);

-- =============================================
-- END OF EXTENDED SEED v3
-- ============================================= 