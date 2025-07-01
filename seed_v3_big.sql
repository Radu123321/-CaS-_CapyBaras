-- =============================================
-- CaS v3 – LARGE SEED DATA (approx. few K rows)
-- Requires PG16 + pgcrypto
-- Apply after createschema_v3.sql
-- psql -U cas -d cas -f seed_v3_big.sql
-- =============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------
-- 1. Branches (10 realistic branches)
-- ---------------------------------------------
INSERT INTO branches (id,name,address,city,phone,created_by)
VALUES
  (1,'București Nord','Șos. București-Ploiești 15','București','021-301-111',1),
  (2,'București Sud','Bd. Metalurgiei 99','București','021-302-222',1),
  (3,'Cluj Central','Str. Memorandumului 12','Cluj-Napoca','0264-401-123',1),
  (4,'Timișoara Vest','Calea Șagului 45','Timișoara','0256-987-654',1),
  (5,'Iași Est','Șos. Bucium 7','Iași','0232-555-333',1),
  (6,'Constanța Port','Bd. Aurel Vlaicu 201','Constanța','0241-777-888',1),
  (7,'Brașov Mont','Str. Poienelor 8','Brașov','0268-123-900',1),
  (8,'Craiova Oltenia','Calea București 210','Craiova','0251-456-789',1),
  (9,'Oradea Criș','Str. Republicii 30','Oradea','0259-321-654',1),
  (10,'Galați Dunăre','Str. Brăilei 140','Galați','0236-456-001',1);

-- ---------------------------------------------
-- 2. Users (admins/managers/employees/customers)
--    1 admin, 5 managers, 100 employees, 200 customers
-- ---------------------------------------------
-- Admin
INSERT INTO users (email,pwd_hash,role,first_name,last_name,approved)
VALUES ('admin@cas.local', encode(digest('admin123','sha256'),'hex'),'ADMIN','Ada','Min',true);

-- Managers  (branch 1..5)
INSERT INTO users (email,pwd_hash,role,branch_id,first_name,last_name,approved)
SELECT format('manager%s@cas.local',i),
       encode(digest('manager'||i||'123','sha256'),'hex'),
       'MANAGER', i,
       'Mgr'||i, 'User', true
FROM generate_series(1,5) i;

-- Employees (branch 1..10) total 100
INSERT INTO users (email,pwd_hash,role,branch_id,first_name,last_name,approved)
SELECT format('emp%s@cas.local',i),
       encode(digest('emp'||i||'123','sha256'),'hex'),
       'EMPLOYEE', ((i-1) % 10)+1,
       'Emp'||i, 'Loyee', true
FROM generate_series(1,100) i;

-- Customers 200
INSERT INTO users (email,pwd_hash,role,first_name,last_name,approved)
SELECT format('cust%s@cas.local',i),
       encode(digest('cust'||i||'123','sha256'),'hex'),
       'CUSTOMER', 'Cust'||i, 'Omer', true
FROM generate_series(1,200) i;

-- Fill employees_profiles
INSERT INTO employees_profiles (employee_id, staff_role, hourly_rate, hire_date)
SELECT id, (CASE WHEN random() < 0.3 THEN 'DRIVER' ELSE 'WASHER' END),
       20 + (random()*10)::int, CURRENT_DATE - ((random()*365)::int)
FROM users WHERE role='EMPLOYEE';

-- ---------------------------------------------
-- 3. Catalog extras (service categories, consumables)
-- ---------------------------------------------
INSERT INTO service_categories (code,description) VALUES
  ('EXT','Exterior'),('INT','Interior'),('DET','Detailing')
ON CONFLICT DO NOTHING;

INSERT INTO consumable_items (code,name,unit_code) VALUES
 ('SOAP','Detergent lichid','ml'),
 ('SHAMPOO','Șampon auto','ml'),
 ('WAX','Ceară auto','ml'),
 ('GLASS','Soluție geamuri','ml'),
 ('DEGREASE','Degresant puternic','ml')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------
-- 4. Inventory initial stocks per branch for each consumable (0 qty)
-- ---------------------------------------------
INSERT INTO inventory_stocks (branch_id,item_code,qty_on_hand,min_qty)
SELECT b.id, c.code, 0, 500
FROM branches b CROSS JOIN consumable_items c;

-- Restock sample (+5000) – COMMENTED pentru teste manuale
-- INSERT INTO inventory_transactions (stock_id, qty_delta, reason_code, created_by)
-- SELECT s.id, 5000, 'RESTOCK', 1
-- FROM inventory_stocks s;

-- ---------------------------------------------
-- 5. Equipment (5 per branch = 50)
-- ---------------------------------------------
INSERT INTO equipment_types (code,description,default_usage_unit) VALUES ('PRESSURE','Aparat presiune','h') ON CONFLICT DO NOTHING;

INSERT INTO equipment (branch_id,type_code,name,status)
SELECT b.id, 'PRESSURE', 'Washer '||gs::text, (array['OPERATIONAL','MAINTENANCE','BROKEN','RETIRED'])[ (random()*3)::int +1 ]
FROM branches b, generate_series(1,5) gs;

-- ---------------------------------------------
-- 6. Services (15 services)
-- ---------------------------------------------
INSERT INTO services (category_code,name,description,base_price,avg_duration_min)
SELECT (ARRAY['EXT','INT','DET'])[ ((gs-1)%3)+1 ],
       'Service '||gs,
       'Demo service '||gs,
       30 + (gs*2),
       15 + (gs*2)
FROM generate_series(1,15) gs;

-- Add requirements (SOAP 30ml for each)
INSERT INTO services_requirements (service_id,resource_type,resource_code,qty_needed,unit_code)
SELECT id,'CONSUMABLE','SOAP',30,'ml' FROM services;

-- ---------------------------------------------
-- 7. Orders (500 orders with items and assignments)
-- ---------------------------------------------
DO $$
DECLARE
  o int;
  cust_id int;
  srv_id int;
  emp_id int;
  br int;
  st text;
  statuses text[] := ARRAY['NEW','SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED'];
BEGIN
  FOR o IN 1..500 LOOP
    SELECT id INTO cust_id FROM users WHERE role='CUSTOMER' ORDER BY random() LIMIT 1;
    SELECT id INTO br FROM branches ORDER BY random() LIMIT 1;
    SELECT id INTO srv_id FROM services ORDER BY random() LIMIT 1;
    SELECT id INTO emp_id FROM users WHERE role='EMPLOYEE' AND branch_id=br ORDER BY random() LIMIT 1;
    st := statuses[ (random()*4)::int +1 ];
    INSERT INTO orders (customer_id,branch_id,status,scheduled_start,total_price)
      VALUES (cust_id, br, st, CURRENT_TIMESTAMP + (random()*10-5)*'1 day'::interval, 50+random()*50) RETURNING id INTO o;
    INSERT INTO order_items (order_id,seq_no,service_id,qty,price_unit,price_total)
      VALUES (o,1,srv_id,1,50,50);
    INSERT INTO order_assignments (order_id,employee_id,role_code)
      VALUES (o,emp_id,'WASHER') ON CONFLICT DO NOTHING;
  END LOOP;
END$$;

-- ---------------------------------------------
-- 8. Routes (one per order of status SCHEDULED/IN_PROGRESS)
-- ---------------------------------------------
INSERT INTO routes (order_id,type,status)
SELECT id,
       'PICKUP',
       (CASE WHEN status='SCHEDULED' THEN 'PLANNED' ELSE 'ON_ROUTE' END)
FROM orders WHERE status IN ('SCHEDULED','IN_PROGRESS');

-- ---------------------------------------------
-- 9. Shifts (generate for each employee today)
-- ---------------------------------------------
INSERT INTO shifts (employee_id,branch_id,shift_role_code,start_ts)
SELECT u.id,u.branch_id,'WASHER',CURRENT_DATE + interval '8 hours'
FROM users u WHERE role='EMPLOYEE';

-- ---------------------------------------------
-- END LARGE SEED
-- ============================================= 