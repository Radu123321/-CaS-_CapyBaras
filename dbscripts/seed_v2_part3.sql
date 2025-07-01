-- =====================================================
-- CaS Database Seed v2.0 - Part 3
-- Comenzi, Transport, Mentenanță, Meteo, Notificări
-- =====================================================

-- Reset sequences
ALTER SEQUENCE orders_order_id_seq RESTART WITH 1;
ALTER SEQUENCE recurring_schedules_schedule_id_seq RESTART WITH 1;
ALTER SEQUENCE transport_requests_transport_id_seq RESTART WITH 1;
ALTER SEQUENCE maintenance_schedules_maintenance_id_seq RESTART WITH 1;
ALTER SEQUENCE weather_conditions_weather_id_seq RESTART WITH 1;
ALTER SEQUENCE exception_reports_exception_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_notification_id_seq RESTART WITH 1;

-- =====================================================
-- COMENZI (Orders)
-- =====================================================

INSERT INTO orders (customer_id, location_id, service_id, assigned_employee_id, order_code, status, priority, item_description, item_type, item_condition, special_instructions, base_price, transport_fee, additional_fees, discount, total_amount, scheduled_date, scheduled_time, estimated_duration, pickup_address, delivery_address) VALUES

-- Comenzi finalizate (pentru istoric)
(1, 1, 1, 1, 'ORD000001', 'COMPLETED', 'NORMAL', 'Covor persian 3x2m', 'Covor oriental', 'Pete de vin și praf acumulat', 'Atenție la marginile delicate', 45.00, 20.00, 0.00, 5.00, 60.00, '2024-12-10', '09:00', 120, 'Strada Demo nr. 1, București', 'Strada Demo nr. 1, București'),

(2, 2, 6, 4, 'ORD000002', 'COMPLETED', 'HIGH', 'BMW X5 2020', 'SUV Premium', 'Foarte murdar după off-road', 'Curățare specială pentru piele', 65.00, 0.00, 15.00, 0.00, 80.00, '2024-12-12', '14:30', 90, NULL, NULL),

(3, 1, 9, 1, 'ORD000003', 'COMPLETED', 'NORMAL', 'Costum business', 'Îmbrăcăminte formală', 'Pete de cafea pe jachetă', 'Urgență pentru întâlnire', 25.00, 15.00, 10.00, 0.00, 50.00, '2024-12-11', '08:00', 1440, 'Calea Vitan nr. 55, București', 'Calea Vitan nr. 55, București'),

-- Comenzi în progres
(4, 3, 5, 5, 'ORD000004', 'IN_PROGRESS', 'NORMAL', 'Dacia Logan 2018', 'Berlină', 'Spălare de rutină', 'Fără ceară', 35.00, 0.00, 0.00, 3.50, 31.50, '2024-12-20', '10:00', 45, NULL, NULL),

(5, 2, 13, 3, 'ORD000005', 'IN_PROGRESS', 'HIGH', 'Canapea 3 locuri', 'Mobilier tapițat', 'Pete de mâncare și păr de animale', 'Apartament la etajul 4, fără lift', 180.00, 25.00, 20.00, 0.00, 225.00, '2024-12-20', '11:30', 240, 'Strada Amzei nr. 25, București', 'Strada Amzei nr. 25, București'),

-- Comenzi confirmate (programate)
(6, 1, 2, 1, 'ORD000006', 'CONFIRMED', 'NORMAL', 'Covor Persan antique', 'Covor de valoare', 'Necesită curățare delicată', 'Foarte valoros, atenție maximă', 75.00, 20.00, 0.00, 0.00, 95.00, '2024-12-21', '09:30', 180, 'Strada Mihai Bravu nr. 89, București', 'Strada Mihai Bravu nr. 89, București'),

(7, 2, 7, 4, 'ORD000007', 'CONFIRMED', 'URGENT', 'Mercedes E-Class', 'Berlină luxury', 'Pregătire pentru eveniment', 'Detailing complet pentru nuntă', 150.00, 0.00, 25.00, 15.00, 160.00, '2024-12-21', '13:00', 240, NULL, NULL),

(8, 3, 12, 5, 'ORD000008', 'CONFIRMED', 'NORMAL', 'Rochie de seară', 'Îmbrăcăminte elegantă', 'Necesită călcare specială', 'Material delicat - mătase', 15.00, 12.00, 8.00, 0.00, 35.00, '2024-12-22', '15:00', 720, 'Strada Splaiul Unirii nr. 12, București', 'Strada Splaiul Unirii nr. 12, București'),

-- Comenzi în așteptare
(9, 2, 11, NULL, 'ORD000009', 'PENDING', 'HIGH', 'Jachetă piele', 'Îmbrăcăminte premium', 'Jachetă de motociclist', 'Foarte importantă pentru client', 80.00, 15.00, 0.00, 8.00, 87.00, '2024-12-23', '10:00', 2880, 'Strada Aviatorilor nr. 40, București', 'Strada Aviatorilor nr. 40, București'),

(10, 1, 17, NULL, 'ORD000010', 'PENDING', 'NORMAL', 'Saltea matrimonială', 'Mobilier dormitor', 'Curățare și dezinfectare', 'Apartament cu acces dificil', 95.00, 30.00, 15.00, 0.00, 140.00, '2024-12-24', '14:00', 150, 'Șoseaua Colentina nr. 425, București', 'Șoseaua Colentina nr. 425, București');

-- =====================================================
-- PROGRAMĂRI RECURENTE (Recurring Schedules)
-- =====================================================

INSERT INTO recurring_schedules (customer_id, location_id, service_id, frequency, interval_value, days_of_week, item_description, special_instructions, pickup_address, delivery_address, is_active, start_date, next_execution) VALUES

-- Programări săptămânale
(9, 2, 6, 'WEEKLY', 1, ARRAY[1,3,5], 'Flotă 5 mașini de companie', 'Spălare completă pentru toate vehiculele', 'Strada Aviatorilor nr. 40, București', 'Strada Aviatorilor nr. 40, București', true, '2024-12-01', '2024-12-23'),

(10, 1, 1, 'WEEKLY', 2, ARRAY[6], 'Covoare birouri', 'Curățare covoare din 3 săli de conferințe', 'Șoseaua Colentina nr. 425, București', 'Șoseaua Colentina nr. 425, București', true, '2024-11-15', '2024-12-28'),

-- Programări lunare
(2, 2, 13, 'MONTHLY', 1, NULL, 'Canapele living și dormitor', 'Curățare completă mobilier tapițat', 'Strada Victoriei nr. 120, București', 'Strada Victoriei nr. 120, București', true, '2024-12-01', '2025-01-01'),

(7, 1, 9, 'MONTHLY', 1, NULL, 'Costume business', 'Curățare chimică costume de lucru', 'Calea Floreasca nr. 167, București', 'Calea Floreasca nr. 167, București', true, '2024-11-01', '2025-01-01'),

-- Programări trimestriale
(5, 2, 2, 'QUARTERLY', 1, NULL, 'Covoare apartament', 'Curățare premium pentru toate covoarele', 'Strada Amzei nr. 25, București', 'Strada Amzei nr. 25, București', true, '2024-10-01', '2025-01-01');

-- =====================================================
-- EVALUĂRI COMENZI (Order Reviews)
-- =====================================================

INSERT INTO order_reviews (order_id, customer_id, rating, service_quality_rating, timeliness_rating, staff_rating, comment, would_recommend) VALUES
(1, 1, 5, 5, 5, 5, 'Serviciu excelent! Covorul arată ca nou. Personalul foarte profesionist și punctual.', true),
(2, 2, 4, 5, 4, 4, 'Mașina a fost curățată foarte bine, dar au întârziat puțin. Per total, foarte mulțumit.', true),
(3, 3, 5, 5, 5, 5, 'Serviciu rapid și eficient. Costumul a fost gata la timp pentru întâlnire. Recomand!', true);

-- =====================================================
-- SOLICITĂRI TRANSPORT (Transport Requests)
-- =====================================================

INSERT INTO transport_requests (order_id, type, pickup_address, pickup_contact_name, pickup_contact_phone, pickup_instructions, delivery_address, delivery_contact_name, delivery_contact_phone, delivery_instructions, scheduled_pickup_date, scheduled_pickup_time, scheduled_delivery_date, scheduled_delivery_time, assigned_driver_id, status, transport_fee, distance_km) VALUES

-- Transport pentru comenzile cu ridicare/livrare
(1, 'BOTH', 'Strada Demo nr. 1, București', 'Demo Client', '+40721000011', 'Apartament 2, etaj 1', 'Strada Demo nr. 1, București', 'Demo Client', '+40721000011', 'Același apartament', '2024-12-10', '08:30', '2024-12-10', '16:00', 1, 'COMPLETED', 20.00, 8.5),

(3, 'BOTH', 'Calea Vitan nr. 55, București', 'Maria Ionescu', '+40721000013', 'Birou 304, clădirea A', 'Calea Vitan nr. 55, București', 'Maria Ionescu', '+40721000013', 'Același birou', '2024-12-11', '07:30', '2024-12-11', '18:00', 1, 'COMPLETED', 15.00, 6.2),

(5, 'BOTH', 'Strada Amzei nr. 25, București', 'Elena Marin', '+40721000015', 'Apartament 15, etaj 4, fără lift', 'Strada Amzei nr. 25, București', 'Elena Marin', '+40721000015', 'Atenție la scări', '2024-12-20', '11:00', '2024-12-20', '17:30', 6, 'IN_TRANSIT', 25.00, 12.3),

(6, 'BOTH', 'Strada Mihai Bravu nr. 89, București', 'Cristian Radu', '+40721000016', 'Casa cu gard verde', 'Strada Mihai Bravu nr. 89, București', 'Cristian Radu', '+40721000016', 'Să sune la poartă', '2024-12-21', '09:00', '2024-12-21', '15:00', 1, 'ASSIGNED', 20.00, 9.8);

-- =====================================================
-- RESURSE UTILIZATE ÎN COMENZI (Order Resources)
-- =====================================================

INSERT INTO order_resources (order_id, resource_id, quantity_used, cost_per_unit, recorded_by) VALUES
-- Resurse pentru comanda 1 (covor persian)
(1, 1, 0.8, 12.50, 1), -- Detergent universal
(1, 13, 3, 28.50, 1),  -- Lavete microfibră 
(1, 16, 15.0, 1.20, 1), -- Apă demineralizată

-- Resurse pentru comanda 2 (BMW)
(2, 5, 0.5, 8.90, 4),  -- Șampon auto
(2, 7, 0.2, 32.00, 4), -- Ceară auto
(2, 13, 2, 28.50, 4),  -- Lavete microfibră

-- Resurse pentru comanda 3 (costum)
(3, 9, 1.2, 22.80, 1), -- Detergent curățare chimică
(3, 10, 0.3, 9.60, 1), -- Balsam textile
(3, 11, 0.2, 16.40, 1); -- Soluție antimicrobiană

-- =====================================================
-- PROGRAMĂRI MENTENANȚĂ (Maintenance Schedules)
-- =====================================================

INSERT INTO maintenance_schedules (equipment_id, type, scheduled_date, scheduled_time, assigned_technician_id, description, estimated_duration, estimated_cost, status) VALUES

-- Mentenanță preventivă
(1, 'PREVENTIVE', '2025-02-01', '08:00', 1, 'Verificare generală și înlocuire filtre mașină spălat covoare', 120, 150.00, 'SCHEDULED'),
(2, 'PREVENTIVE', '2025-01-15', '09:00', 1, 'Curățare și verificare aspirator industrial', 90, 80.00, 'SCHEDULED'),
(4, 'PREVENTIVE', '2025-01-20', '10:00', 4, 'Service complet spălător auto - verificare pompe și duze', 180, 250.00, 'SCHEDULED'),

-- Mentenanță corectivă
(6, 'CORRECTIVE', '2025-01-05', '14:00', 4, 'Înlocuire filtru aspirator profesional', 60, 120.00, 'SCHEDULED'),
(9, 'EMERGENCY', '2024-12-22', '09:00', 5, 'Reparație motor echipament curățare - defect urgent', 240, 450.00, 'SCHEDULED'),

-- Mentenanță finalizată
(3, 'PREVENTIVE', '2024-11-10', '08:00', 1, 'Verificare și curățare uscător covoare', 90, 75.00, 'COMPLETED');

-- =====================================================
-- CONDIȚII METEO (Weather Conditions)
-- =====================================================

INSERT INTO weather_conditions (location_id, date, temperature, humidity, precipitation, wind_speed, weather_type, impact_on_operations) VALUES

-- Ultimele 7 zile pentru toate locațiile
(1, '2024-12-14', 2.5, 78, 0.0, 12.3, 'CLOUDY', 'Condiții normale - fără impact'),
(1, '2024-12-15', -1.2, 85, 2.3, 8.7, 'LIGHT_SNOW', 'Transport întârziat cu 30 min'),
(1, '2024-12-16', 0.8, 82, 0.5, 15.2, 'RAINY', 'Uscare covoare prelungită cu 2h'),
(1, '2024-12-17', 4.2, 65, 0.0, 22.1, 'WINDY', 'Condiții normale'),
(1, '2024-12-18', 6.8, 58, 0.0, 8.9, 'SUNNY', 'Condiții optime pentru uscare'),
(1, '2024-12-19', 3.1, 72, 1.2, 18.5, 'RAINY', 'Transport auto redus'),
(1, '2024-12-20', 1.5, 88, 3.8, 25.4, 'STORMY', 'Servicii transport suspendate temporar'),

(2, '2024-12-14', 3.1, 75, 0.0, 14.2, 'CLOUDY', 'Condiții normale'),
(2, '2024-12-15', -0.5, 82, 1.8, 9.8, 'LIGHT_SNOW', 'Spălare auto redusă cu 20%'),
(2, '2024-12-16', 1.2, 79, 0.8, 16.7, 'RAINY', 'Cerere crescută pentru spălare auto'),
(2, '2024-12-17', 4.8, 62, 0.0, 24.3, 'WINDY', 'Condiții normale'),
(2, '2024-12-18', 7.2, 55, 0.0, 7.6, 'SUNNY', 'Zi ocupată - toate serviciile active'),
(2, '2024-12-19', 3.8, 69, 0.9, 19.8, 'RAINY', 'Program normal'),
(2, '2024-12-20', 2.1, 85, 4.2, 28.1, 'STORMY', 'Servicii exterioare suspendate'),

(3, '2024-12-14', 2.8, 76, 0.0, 11.9, 'CLOUDY', 'Condiții normale'),
(3, '2024-12-15', -0.8, 88, 2.1, 7.4, 'LIGHT_SNOW', 'Dificultăți transport în zonele nedegivrare'),
(3, '2024-12-16', 1.5, 81, 0.6, 14.8, 'RAINY', 'Uscare prelungită pentru textile'),
(3, '2024-12-17', 4.5, 64, 0.0, 21.7, 'WINDY', 'Condiții normale'),
(3, '2024-12-18', 6.9, 59, 0.0, 9.2, 'SUNNY', 'Zi productivă'),
(3, '2024-12-19', 3.4, 71, 1.1, 17.3, 'RAINY', 'Program adaptat'),
(3, '2024-12-20', 1.8, 86, 3.9, 26.8, 'STORMY', 'Activități reduse');

-- =====================================================
-- RAPOARTE EXCEPȚII (Exception Reports)
-- =====================================================

INSERT INTO exception_reports (location_id, reported_by, type, severity, title, description, affected_orders, estimated_downtime, financial_impact, status, email_sent, notification_sent) VALUES

-- Excepții recente
(3, 5, 'EQUIPMENT_FAILURE', 'HIGH', 'Defect motor echipament principal', 'Motorul echipamentului de curățare EC-1 s-a defectat în timpul operațiunii. Necesită reparație urgentă.', ARRAY[8, 10], 480, 850.00, 'IN_PROGRESS', true, true),

(2, 4, 'STAFF_UNAVAILABLE', 'MEDIUM', 'Angajat în concediu medical', 'Angajatul Cristina Radu este în concediu medical pentru 3 zile. Redistribuire sarcini necesară.', ARRAY[7], 0, 200.00, 'RESOLVED', true, true),

(1, 1, 'SUPPLY_SHORTAGE', 'LOW', 'Stoc scăzut soluție eliminare pete', 'Stocul de soluție pentru eliminarea petelor este sub pragul minim. Comandă urgentă plasată.', ARRAY[]::INTEGER[], 0, 0.00, 'RESOLVED', false, true),

-- Excepție închisă
(2, 3, 'POWER_OUTAGE', 'CRITICAL', 'Pană de curent în zona Herastrau', 'Pană de curent generală în zonă timp de 4 ore. Toate operațiunile suspendate.', ARRAY[2, 5], 240, 1200.00, 'CLOSED', true, true);

-- =====================================================
-- NOTIFICĂRI (Notifications)
-- =====================================================

INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id, is_read, is_sent, sent_via, scheduled_for) VALUES

-- Notificări pentru admin
(1, 'SYSTEM_ALERT', 'Echipament defect la Berceni', 'Echipamentul EC-1 de la locația Berceni necesită reparație urgentă.', 'EQUIPMENT', 9, false, true, ARRAY['EMAIL', 'BROWSER'], CURRENT_TIMESTAMP),
(1, 'LOW_STOCK', 'Stoc scăzut la multiple locații', 'Alertă: Stocuri scăzute la 3 resurse în sistem.', 'INVENTORY', NULL, true, true, ARRAY['EMAIL'], CURRENT_TIMESTAMP - INTERVAL '2 hours'),

-- Notificări pentru manageri
(2, 'ORDER_UPDATE', 'Comandă nouă primită', 'Comandă ORD000006 confirmată pentru mâine la 09:30.', 'ORDER', 6, true, true, ARRAY['BROWSER'], CURRENT_TIMESTAMP - INTERVAL '1 day'),
(3, 'MAINTENANCE_DUE', 'Mentenanță programată', 'Spălătorul auto SA-1 are mentenanță programată pentru 20 ianuarie.', 'EQUIPMENT', 4, false, true, ARRAY['EMAIL', 'BROWSER'], CURRENT_TIMESTAMP),
(4, 'EXCEPTION_REPORT', 'Echipament defect', 'Raport excepție: Echipamentul EC-1 necesită reparație urgentă.', 'EXCEPTION', 1, false, true, ARRAY['EMAIL', 'BROWSER'], CURRENT_TIMESTAMP),

-- Notificări pentru angajați
(5, 'TASK_ASSIGNED', 'Sarcină nouă atribuită', 'Ați fost atribuit la comanda ORD000004 - Dacia Logan.', 'ORDER', 4, true, true, ARRAY['BROWSER'], CURRENT_TIMESTAMP - INTERVAL '3 hours'),
(6, 'TRANSPORT_SCHEDULED', 'Transport programat', 'Transport programat pentru comanda ORD000005 la 11:00.', 'TRANSPORT', 3, false, true, ARRAY['BROWSER'], CURRENT_TIMESTAMP + INTERVAL '30 minutes'),
(7, 'SHIFT_REMINDER', 'Memento schimb', 'Schimbul dumneavoastră începe mâine la 08:00.', 'SHIFT', NULL, false, false, ARRAY['BROWSER'], CURRENT_TIMESTAMP + INTERVAL '12 hours'),

-- Notificări pentru clienți
(11, 'ORDER_CONFIRMED', 'Comanda confirmată', 'Comanda ORD000001 a fost finalizată cu succes. Vă rugăm să evaluați serviciul.', 'ORDER', 1, true, true, ARRAY['EMAIL'], CURRENT_TIMESTAMP - INTERVAL '2 days'),
(12, 'ORDER_READY', 'Serviciu finalizat', 'BMW X5 este gata pentru ridicare. Vă așteptăm!', 'ORDER', 2, true, true, ARRAY['EMAIL', 'SMS'], CURRENT_TIMESTAMP - INTERVAL '1 day'),
(13, 'ORDER_IN_PROGRESS', 'Comandă în progres', 'Costumul dumneavoastră este în proces de curățare chimică.', 'ORDER', 3, false, true, ARRAY['EMAIL'], CURRENT_TIMESTAMP - INTERVAL '6 hours'),
(14, 'RECURRING_REMINDER', 'Memento serviciu recurent', 'Serviciul dumneavoastră recurent este programat pentru săptămâna viitoare.', 'RECURRING', 1, false, false, ARRAY['EMAIL'], CURRENT_TIMESTAMP + INTERVAL '3 days');

-- =====================================================
-- SCHIMBURI ANGAJAȚI (Employee Shifts)
-- =====================================================

INSERT INTO employee_shifts (employee_id, location_id, shift_date, start_time, end_time, break_duration, actual_start_time, actual_end_time, total_hours, status, notes) VALUES

-- Schimburi finalizate (săptămâna trecută)
(1, 1, '2024-12-16', '08:00', '16:00', 30, '2024-12-16 08:05:00', '2024-12-16 16:10:00', 7.58, 'COMPLETED', 'Zi normală de lucru'),
(1, 1, '2024-12-17', '08:00', '16:00', 30, '2024-12-17 07:55:00', '2024-12-17 16:00:00', 7.58, 'COMPLETED', 'A început mai devreme'),
(1, 1, '2024-12-18', '08:00', '16:00', 30, '2024-12-18 08:00:00', '2024-12-18 16:15:00', 7.75, 'COMPLETED', 'Prelungire pentru finalizare comandă'),

(2, 1, '2024-12-16', '09:00', '17:00', 45, '2024-12-16 09:10:00', '2024-12-16 17:05:00', 7.17, 'COMPLETED', 'Întârziere mică la început'),
(2, 1, '2024-12-17', '09:00', '17:00', 45, '2024-12-17 09:00:00', '2024-12-17 17:00:00', 7.25, 'COMPLETED', 'Zi normală'),

-- Schimburi în curs (astăzi)
(3, 2, '2024-12-20', '08:00', '16:00', 30, '2024-12-20 08:00:00', NULL, NULL, 'ACTIVE', 'Schimb în curs'),
(4, 2, '2024-12-20', '10:00', '18:00', 45, '2024-12-20 09:55:00', NULL, NULL, 'ACTIVE', 'A început puțin mai devreme'),
(5, 3, '2024-12-20', '08:00', '16:00', 30, '2024-12-20 08:10:00', NULL, NULL, 'ACTIVE', 'Întârziere 10 minute'),

-- Schimburi programate (viitoare)
(1, 1, '2024-12-21', '08:00', '16:00', 30, NULL, NULL, NULL, 'SCHEDULED', NULL),
(2, 1, '2024-12-21', '09:00', '17:00', 45, NULL, NULL, NULL, 'SCHEDULED', NULL),
(3, 2, '2024-12-21', '08:00', '16:00', 30, NULL, NULL, NULL, 'SCHEDULED', NULL),
(4, 2, '2024-12-21', '10:00', '18:00', 45, NULL, NULL, NULL, 'SCHEDULED', NULL),
(5, 3, '2024-12-21', '08:00', '16:00', 30, NULL, NULL, NULL, 'SCHEDULED', NULL),
(6, 3, '2024-12-21', '14:00', '22:00', 45, NULL, NULL, NULL, 'SCHEDULED', 'Schimb de după-amiază');

-- =====================================================
-- VERIFICARE INSERĂRI
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Seed Part 3 completat cu succes!';
    RAISE NOTICE 'Comenzi create: %', (SELECT COUNT(*) FROM orders);
    RAISE NOTICE 'Programări recurente: %', (SELECT COUNT(*) FROM recurring_schedules);
    RAISE NOTICE 'Solicitări transport: %', (SELECT COUNT(*) FROM transport_requests);
    RAISE NOTICE 'Programări mentenanță: %', (SELECT COUNT(*) FROM maintenance_schedules);
    RAISE NOTICE 'Condiții meteo: %', (SELECT COUNT(*) FROM weather_conditions);
    RAISE NOTICE 'Rapoarte excepții: %', (SELECT COUNT(*) FROM exception_reports);
    RAISE NOTICE 'Notificări: %', (SELECT COUNT(*) FROM notifications);
    RAISE NOTICE 'Schimburi angajați: %', (SELECT COUNT(*) FROM employee_shifts);
END $$; 