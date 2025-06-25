-- =====================================================
-- CaS Database Seed v2.0 - Part 4
-- RSS Feeds și Finalizare
-- =====================================================

-- Reset sequences
ALTER SEQUENCE rss_feeds_feed_id_seq RESTART WITH 1;

-- =====================================================
-- RSS FEEDS (pentru monitorizare locații)
-- =====================================================

INSERT INTO rss_feeds (location_id, category, title, description, content, guid, is_published) VALUES

-- RSS pentru Centrul Vechi
(1, 'STATUS', 'CaS Centrul Vechi - Status Operațional', 'Status în timp real al locației din Centrul Vechi', 
'<status>
  <location>CaS Centrul Vechi</location>
  <operational_status>ACTIVE</operational_status>
  <current_capacity>12/15</current_capacity>
  <active_orders>3</active_orders>
  <equipment_status>
    <equipment name="Mașină Spălat Covoare Pro-1" status="OPERATIVE"/>
    <equipment name="Aspirator Industrial V1" status="OPERATIVE"/>
    <equipment name="Uscător Covoare D1" status="OPERATIVE"/>
  </equipment_status>
  <staff_on_duty>2</staff_on_duty>
  <estimated_wait_time>45 minutes</estimated_wait_time>
  <last_update>' || CURRENT_TIMESTAMP || '</last_update>
</status>', 'cas-centru-status-' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP), true),

(1, 'ORDERS', 'CaS Centrul Vechi - Comenzi Active', 'Comenzi în progres la locația din Centrul Vechi',
'<orders>
  <location>CaS Centrul Vechi</location>
  <total_active_orders>3</total_active_orders>
  <orders_in_progress>1</orders_in_progress>
  <orders_confirmed>2</orders_confirmed>
  <avg_completion_time>180 minutes</avg_completion_time>
  <next_available_slot>2024-12-21 14:00</next_available_slot>
  <services_most_requested>
    <service>Curățare Covor Standard</service>
    <service>Curățare Chimică Standard</service>
  </services_most_requested>
  <last_update>' || CURRENT_TIMESTAMP || '</last_update>
</orders>', 'cas-centru-orders-' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP), true),

-- RSS pentru Herastrau
(2, 'STATUS', 'CaS Herastrau - Status Operațional', 'Status în timp real al locației din zona Herastrau',
'<status>
  <location>CaS Herastrau</location>
  <operational_status>ACTIVE</operational_status>
  <current_capacity>18/20</current_capacity>
  <active_orders>4</active_orders>
  <equipment_status>
    <equipment name="Spălător Auto Automat SA-1" status="OPERATIVE"/>
    <equipment name="Mașină Spălat Textile MT-1" status="OPERATIVE"/>
    <equipment name="Aspirator Profesional V2" status="MAINTENANCE"/>
    <equipment name="Fier de Călcat Industrial" status="OPERATIVE"/>
  </equipment_status>
  <staff_on_duty>2</staff_on_duty>
  <estimated_wait_time>30 minutes</estimated_wait_time>
  <last_update>' || CURRENT_TIMESTAMP || '</last_update>
</status>', 'cas-herastrau-status-' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP), true),

(2, 'ORDERS', 'CaS Herastrau - Comenzi Active', 'Comenzi în progres la locația din zona Herastrau',
'<orders>
  <location>CaS Herastrau</location>
  <total_active_orders>4</total_active_orders>
  <orders_in_progress>2</orders_in_progress>
  <orders_confirmed>2</orders_confirmed>
  <avg_completion_time>150 minutes</avg_completion_time>
  <next_available_slot>2024-12-21 16:00</next_available_slot>
  <services_most_requested>
    <service>Spălare Auto Completă</service>
    <service>Detailing Auto Premium</service>
    <service>Curățare Canapea 3 Locuri</service>
  </services_most_requested>
  <last_update>' || CURRENT_TIMESTAMP || '</last_update>
</orders>', 'cas-herastrau-orders-' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP), true),

-- RSS pentru Berceni
(3, 'STATUS', 'CaS Berceni - Status Operațional', 'Status în timp real al locației din zona Berceni',
'<status>
  <location>CaS Berceni</location>
  <operational_status>LIMITED</operational_status>
  <current_capacity>8/12</current_capacity>
  <active_orders>2</active_orders>
  <equipment_status>
    <equipment name="Mașină Universală MU-1" status="OPERATIVE"/>
    <equipment name="Aspirator Mobil VM-1" status="OPERATIVE"/>
    <equipment name="Echipament Curățare EC-1" status="OUT_OF_SERVICE"/>
  </equipment_status>
  <staff_on_duty>2</staff_on_duty>
  <estimated_wait_time>60 minutes</estimated_wait_time>
  <alerts>
    <alert>Echipament principal în reparație</alert>
    <alert>Capacitate redusă temporar</alert>
  </alerts>
  <last_update>' || CURRENT_TIMESTAMP || '</last_update>
</status>', 'cas-berceni-status-' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP), true),

(3, 'ORDERS', 'CaS Berceni - Comenzi Active', 'Comenzi în progres la locația din zona Berceni',
'<orders>
  <location>CaS Berceni</location>
  <total_active_orders>2</total_active_orders>
  <orders_in_progress>1</orders_in_progress>
  <orders_pending>1</orders_pending>
  <avg_completion_time>200 minutes</avg_completion_time>
  <next_available_slot>2024-12-23 10:00</next_available_slot>
  <services_most_requested>
    <service>Spălare Auto Exterioară</service>
    <service>Curățare Saltea</service>
  </services_most_requested>
  <capacity_note>Capacitate redusă din cauza echipamentului defect</capacity_note>
  <last_update>' || CURRENT_TIMESTAMP || '</last_update>
</orders>', 'cas-berceni-orders-' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP), true),

-- RSS General - Sistem
(1, 'SYSTEM', 'CaS - Status General Sistem', 'Informații generale despre statusul întregului sistem',
'<system_status>
  <total_locations>3</total_locations>
  <locations_active>3</locations_active>
  <total_orders_today>5</total_orders_today>
  <orders_completed_today>0</orders_completed_today>
  <orders_in_progress>4</orders_in_progress>
  <total_customers>10</total_customers>
  <total_employees>6</total_employees>
  <employees_on_duty>6</employees_on_duty>
  <system_health>GOOD</system_health>
  <active_alerts>3</active_alerts>
  <weather_impact>MINIMAL</weather_impact>
  <peak_hours>14:00-18:00</peak_hours>
  <last_update>' || CURRENT_TIMESTAMP || '</last_update>
</system_status>', 'cas-system-status-' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP), true);

-- =====================================================
-- ACTUALIZARE STATISTICI FINALE
-- =====================================================

-- Actualizare total comenzi și sume pentru clienți
UPDATE customers SET 
    total_orders = (
        SELECT COUNT(*) 
        FROM orders 
        WHERE orders.customer_id = customers.customer_id
    ),
    total_spent = (
        SELECT COALESCE(SUM(total_amount), 0) 
        FROM orders 
        WHERE orders.customer_id = customers.customer_id 
        AND status = 'COMPLETED'
    );

-- Actualizare puncte loialitate bazate pe comenzi
UPDATE customers SET 
    loyalty_points = loyalty_points + (
        SELECT COALESCE(SUM(total_amount), 0) * 0.1 
        FROM orders 
        WHERE orders.customer_id = customers.customer_id 
        AND status = 'COMPLETED'
        AND created_at > CURRENT_DATE - INTERVAL '30 days'
    );

-- Actualizare ore utilizare echipamente
UPDATE equipment SET 
    usage_hours = usage_hours + (
        SELECT COALESCE(SUM(estimated_duration), 0) / 60.0
        FROM orders 
        WHERE orders.assigned_employee_id IN (
            SELECT employee_id 
            FROM employees 
            WHERE location_id = equipment.location_id
        )
        AND status IN ('COMPLETED', 'IN_PROGRESS')
        AND created_at > CURRENT_DATE - INTERVAL '7 days'
    );

-- =====================================================
-- FUNCȚII HELPER PENTRU STATISTICI
-- =====================================================

-- Funcție pentru calcularea eficienței pe locație
CREATE OR REPLACE FUNCTION calculate_location_efficiency(loc_id INTEGER)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_orders INTEGER;
    completed_orders INTEGER;
    efficiency DECIMAL(5,2);
BEGIN
    SELECT COUNT(*) INTO total_orders 
    FROM orders 
    WHERE location_id = loc_id 
    AND created_at > CURRENT_DATE - INTERVAL '30 days';
    
    SELECT COUNT(*) INTO completed_orders 
    FROM orders 
    WHERE location_id = loc_id 
    AND status = 'COMPLETED'
    AND created_at > CURRENT_DATE - INTERVAL '30 days';
    
    IF total_orders > 0 THEN
        efficiency := (completed_orders::DECIMAL / total_orders::DECIMAL) * 100;
    ELSE
        efficiency := 0;
    END IF;
    
    RETURN efficiency;
END;
$$ LANGUAGE plpgsql;

-- Funcție pentru calcularea veniturilor pe locație
CREATE OR REPLACE FUNCTION calculate_location_revenue(loc_id INTEGER, days INTEGER DEFAULT 30)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    revenue DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(total_amount), 0) INTO revenue
    FROM orders 
    WHERE location_id = loc_id 
    AND status = 'COMPLETED'
    AND created_at > CURRENT_DATE - (days || ' days')::INTERVAL;
    
    RETURN revenue;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEW-URI PENTRU RAPOARTE
-- =====================================================

-- View pentru statusul locațiilor
CREATE OR REPLACE VIEW location_status_summary AS
SELECT 
    l.location_id,
    l.name,
    l.city,
    COUNT(DISTINCT o.order_id) as active_orders,
    COUNT(DISTINCT e.employee_id) as staff_count,
    COUNT(DISTINCT eq.equipment_id) as total_equipment,
    COUNT(DISTINCT CASE WHEN eq.status = 'OPERATIVE' THEN eq.equipment_id END) as operative_equipment,
    calculate_location_efficiency(l.location_id) as efficiency_percentage,
    calculate_location_revenue(l.location_id) as monthly_revenue
FROM locations l
LEFT JOIN orders o ON l.location_id = o.location_id AND o.status IN ('CONFIRMED', 'IN_PROGRESS')
LEFT JOIN employees e ON l.location_id = e.location_id AND e.is_available = true
LEFT JOIN equipment eq ON l.location_id = eq.location_id
WHERE l.is_active = true
GROUP BY l.location_id, l.name, l.city;

-- View pentru comenzi active
CREATE OR REPLACE VIEW active_orders_summary AS
SELECT 
    o.order_id,
    o.order_code,
    uc.first_name || ' ' || uc.last_name as customer_name,
    l.name as location_name,
    s.name as service_name,
    o.status,
    o.priority,
    o.scheduled_date,
    o.scheduled_time,
    o.total_amount,
    ue.first_name || ' ' || ue.last_name as assigned_employee
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN users uc ON c.user_id = uc.user_id
JOIN locations l ON o.location_id = l.location_id
JOIN services s ON o.service_id = s.service_id
LEFT JOIN employees e ON o.assigned_employee_id = e.employee_id
LEFT JOIN users ue ON e.user_id = ue.user_id
WHERE o.status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')
ORDER BY o.priority DESC, o.scheduled_date, o.scheduled_time;

-- =====================================================
-- INSERARE DATE STATISTICI SAMPLE
-- =====================================================

-- Simulare date pentru ultimele 30 de zile (pentru demonstrație)
INSERT INTO orders (customer_id, location_id, service_id, assigned_employee_id, order_code, status, priority, item_description, base_price, total_amount, scheduled_date, created_at) 
SELECT 
    (RANDOM() * 9 + 1)::INTEGER, -- customer_id random 1-10
    (RANDOM() * 2 + 1)::INTEGER, -- location_id random 1-3
    (RANDOM() * 19 + 1)::INTEGER, -- service_id random 1-20
    (RANDOM() * 5 + 1)::INTEGER, -- employee_id random 1-6
    'ORD' || LPAD((1000 + generate_series)::TEXT, 6, '0'),
    CASE 
        WHEN RANDOM() < 0.7 THEN 'COMPLETED'
        WHEN RANDOM() < 0.9 THEN 'IN_PROGRESS'
        ELSE 'CANCELLED'
    END,
    CASE 
        WHEN RANDOM() < 0.1 THEN 'URGENT'
        WHEN RANDOM() < 0.3 THEN 'HIGH'
        ELSE 'NORMAL'
    END,
    'Articol simulat pentru statistici',
    (RANDOM() * 100 + 20)::DECIMAL(8,2),
    (RANDOM() * 120 + 25)::DECIMAL(8,2),
    CURRENT_DATE - (RANDOM() * 30)::INTEGER,
    CURRENT_TIMESTAMP - (RANDOM() * 30)::INTEGER * INTERVAL '1 day'
FROM generate_series(11, 60); -- Generează 50 de comenzi suplimentare

-- =====================================================
-- VERIFICĂRI FINALE ȘI STATISTICI
-- =====================================================

DO $$
DECLARE
    total_users INTEGER;
    total_locations INTEGER;
    total_services INTEGER;
    total_orders INTEGER;
    total_equipment INTEGER;
    total_resources INTEGER;
    total_notifications INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO total_locations FROM locations;
    SELECT COUNT(*) INTO total_services FROM services;
    SELECT COUNT(*) INTO total_orders FROM orders;
    SELECT COUNT(*) INTO total_equipment FROM equipment;
    SELECT COUNT(*) INTO total_resources FROM resources;
    SELECT COUNT(*) INTO total_notifications FROM notifications;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== SEED COMPLET FINALIZAT CU SUCCES! ===';
    RAISE NOTICE '';
    RAISE NOTICE 'STATISTICI FINALE:';
    RAISE NOTICE '- Utilizatori: %', total_users;
    RAISE NOTICE '- Locații: %', total_locations;
    RAISE NOTICE '- Servicii: %', total_services;
    RAISE NOTICE '- Comenzi: %', total_orders;
    RAISE NOTICE '- Echipamente: %', total_equipment;
    RAISE NOTICE '- Resurse: %', total_resources;
    RAISE NOTICE '- Notificări: %', total_notifications;
    RAISE NOTICE '';
    RAISE NOTICE 'SISTEM GATA PENTRU UTILIZARE!';
    RAISE NOTICE '';
    RAISE NOTICE 'Conturi de test:';
    RAISE NOTICE '- Admin: admin / admin123';
    RAISE NOTICE '- Manager: manager1 / manager123';
    RAISE NOTICE '- Angajat: employee1 / employee123';
    RAISE NOTICE '- Client: client1 / client123';
    RAISE NOTICE '';
END $$; 