/*********************************************************************
* CaS – Enhanced Seed Data v2 - PART 3 (FINAL)
* Weather, Alerts, Daily Stats & Resource Usage
*********************************************************************/

/*********************************************************************
* 12. ORDER RESOURCE USAGE (consumul de resurse per comandă)
*********************************************************************/

INSERT INTO order_resource_usage (order_id, resource_id, quantity, cost) VALUES
-- Comanda 1: Curățare covoare (2 covoare mari + tratament)
(1, 1, 2.5, 46.25),    -- Detergent Universal
(1, 2, 3.0, 66.00),    -- Detergent Specializat Covoare 
(1, 6, 1.0, 65.00),    -- Perie Rotativă (uzură)
(1, 10, 15.0, 48.00),  -- Apă Demineralizată
(1, 15, 8.0, 96.00),   -- Lavete Microfibre
(1, 16, 4.0, 18.00),   -- Mănuși

-- Comanda 2: Spălare auto completă
(2, 3, 1.5, 24.75),    -- Shampoo Auto
(2, 7, 1.0, 35.00),    -- Perie Auto (uzură)
(2, 10, 25.0, 80.00),  -- Apă Demineralizată
(2, 15, 6.0, 72.00),   -- Lavete Microfibre
(2, 16, 2.0, 9.00),    -- Mănuși

-- Comanda 3: Curățare chimică textile
(3, 4, 1.8, 45.00),    -- Detergent Textile Delicat
(3, 5, 0.5, 14.00),    -- Dezinfectant
(3, 8, 1.0, 45.00),    -- Perie Textile (uzură)
(3, 11, 8.0, 36.00),   -- Soluție Clătire
(3, 17, 3.0, 7.50),    -- Pungi Protecție
(3, 18, 5.0, 1.25),    -- Etichete

-- Comanda 4: Detailing premium auto
(4, 3, 2.0, 33.00),    -- Shampoo Auto
(4, 5, 0.8, 22.40),    -- Dezinfectant
(4, 7, 1.0, 35.00),    -- Perie Auto (uzură)
(4, 10, 35.0, 112.00), -- Apă Demineralizată
(4, 14, 5.0, 60.00),   -- Discuri Abrazive
(4, 15, 10.0, 120.00), -- Lavete Microfibre
(4, 16, 3.0, 13.50);   -- Mănuși

/*********************************************************************
* 13. WEATHER SNAPSHOTS (ultimele 7 zile pentru fiecare locație)
*********************************************************************/

INSERT INTO weather_snapshots (location_id, captured_at, temperature_c, humidity_pct, condition, wind_speed, precipitation) VALUES
-- CaS Centrul Vechi (location_id = 1) - ultimele 7 zile
(1, '2025-06-25 12:00:00', 28.5, 65, 'Parțial înnorat', 12.0, 0.0),
(1, '2025-06-24 12:00:00', 26.2, 70, 'Înnorat', 8.5, 2.5),
(1, '2025-06-23 12:00:00', 24.8, 85, 'Ploaie ușoară', 15.0, 8.2),
(1, '2025-06-22 12:00:00', 22.3, 90, 'Ploaie', 18.5, 15.7),
(1, '2025-06-21 12:00:00', 25.1, 75, 'Parțial înnorat', 10.0, 0.0),
(1, '2025-06-20 12:00:00', 29.3, 58, 'Senin', 6.2, 0.0),
(1, '2025-06-19 12:00:00', 31.2, 55, 'Senin', 8.0, 0.0),

-- CaS Herastrau (location_id = 2)
(2, '2025-06-25 12:00:00', 27.8, 68, 'Parțial înnorat', 14.0, 0.0),
(2, '2025-06-24 12:00:00', 25.5, 72, 'Înnorat', 9.0, 1.8),
(2, '2025-06-23 12:00:00', 23.9, 88, 'Ploaie ușoară', 16.5, 9.1),
(2, '2025-06-22 12:00:00', 21.7, 92, 'Ploaie intensă', 20.0, 18.3),
(2, '2025-06-21 12:00:00', 24.8, 77, 'Parțial înnorat', 11.5, 0.0),
(2, '2025-06-20 12:00:00', 28.9, 60, 'Senin', 7.0, 0.0),
(2, '2025-06-19 12:00:00', 30.8, 57, 'Senin', 8.5, 0.0),

-- CaS Dimitrie Cantemir (location_id = 3)
(3, '2025-06-25 12:00:00', 28.1, 66, 'Parțial înnorat', 13.0, 0.0),
(3, '2025-06-24 12:00:00', 25.9, 71, 'Înnorat', 8.8, 2.2),
(3, '2025-06-23 12:00:00', 24.2, 86, 'Ploaie ușoară', 15.8, 7.9),
(3, '2025-06-22 12:00:00', 22.0, 91, 'Ploaie', 19.2, 16.4),
(3, '2025-06-21 12:00:00', 25.0, 76, 'Parțial înnorat', 10.5, 0.0),
(3, '2025-06-20 12:00:00', 29.1, 59, 'Senin', 6.8, 0.0),
(3, '2025-06-19 12:00:00', 31.0, 56, 'Senin', 7.8, 0.0);

/*********************************************************************
* 14. ALERTS (alerte diverse pentru demonstrație)
*********************************************************************/

INSERT INTO alerts (location_id, equipment_id, severity, alert_type, title, message, created_at, resolved_at, resolved_by) VALUES
-- Alerte critice nerezolvate
(2, 7, 'CRITICAL', 'EQUIPMENT_FAILURE', 'Mașină Presiune JET defectă', 'Compresorul principal s-a blocat. Echipamentul este complet nefuncțional și necesită reparație urgentă.', '2025-06-20 14:00:00', '2025-06-20 18:45:00', 11),

(1, 3, 'HIGH', 'MAINTENANCE_REQUIRED', 'Mașină Aburi în mentenanță', 'Pompa principală de abur necesită înlocuire. Echipamentul este temporar indisponibil.', '2025-06-23 09:00:00', NULL, NULL),

-- Alerte inventory critice
(2, NULL, 'CRITICAL', 'OUT_OF_STOCK', 'Stoc epuizat Shampoo Auto', 'Shampoo Auto Professional este complet epuizat la locația CaS Herastrau. Comenzile auto nu pot fi procesate.', '2025-06-22 16:30:00', NULL, NULL),

(2, NULL, 'HIGH', 'LOW_STOCK', 'Stoc scăzut Detergent Covoare', 'Stocul de Detergent Specializat Covoare este sub pragul critic (5L rămase din 12L minim).', '2025-06-24 10:15:00', NULL, NULL),

(3, NULL, 'HIGH', 'LOW_STOCK', 'Stoc critic Aspirator Portabil', 'Doar 1 bucată rămasă din Aspirator Profesional Portabil (minim 2 bucăți).', '2025-06-25 08:30:00', NULL, NULL),

-- Alerte de personal (simulăm indisponibilitate)
(1, NULL, 'MEDIUM', 'STAFF_UNAVAILABLE', 'Tehnician echipamente absent', 'Ion Vasile (tehnician) absent medical până pe 28 iunie. Mentenanțele programate vor fi reprogramate.', '2025-06-24 07:00:00', NULL, NULL),

-- Alerte rezolvate (pentru istoric)
(1, 1, 'MEDIUM', 'MAINTENANCE_DUE', 'Service programat Mașină Covoare', 'Mașina de spălat covoare Pro necesită service preventiv de 6 luni conform garanției.', '2025-06-15 10:00:00', '2025-06-16 14:30:00', 8),

(3, NULL, 'LOW', 'MAINTENANCE_SCHEDULED', 'Mentenanță programată săptămâna viitoare', 'Aspirator Central Textil programat pentru service preventiv pe 26 iunie.', '2025-06-20 16:00:00', '2025-06-21 09:00:00', 12),

-- Alertă meteo (impact operațional)
(2, NULL, 'MEDIUM', 'WEATHER_IMPACT', 'Ploaie intensă - transporturi amânate', 'Condițiile meteo adverse (ploaie 18mm) afectează programul de transport pentru ziua de 22 iunie.', '2025-06-22 06:00:00', '2025-06-23 10:00:00', 6);

/*********************************************************************
* 15. DAILY STATS (statistici ultimele 7 zile)
*********************************************************************/

INSERT INTO daily_stats (location_id, date, orders_count, revenue, resource_cost, maintenance_cost, efficiency_avg) VALUES
-- CaS Centrul Vechi (location_id = 1)
(1, '2025-06-25', 2, 270.00, 95.50, 0.00, 0.89),      -- Azi: comanda în progres + programată
(1, '2025-06-24', 3, 185.00, 78.25, 0.00, 0.91),      -- Ieri
(1, '2025-06-23', 1, 95.00, 34.50, 850.00, 0.75),     -- Cu mentenanță scumpă
(1, '2025-06-22', 2, 160.00, 67.80, 0.00, 0.88),      -- Ploaie - eficiență mai mică
(1, '2025-06-21', 4, 320.00, 125.30, 0.00, 0.93),     -- Zi bună
(1, '2025-06-20', 5, 380.00, 142.75, 0.00, 0.92),     -- Zi foarte bună
(1, '2025-06-19', 3, 210.00, 89.20, 0.00, 0.90),      -- Weekend

-- CaS Herastrau (location_id = 2) - afectat de stocuri și echipament defect
(2, '2025-06-25', 1, 45.00, 18.50, 0.00, 0.85),       -- Azi: probleme stoc
(2, '2025-06-24', 0, 0.00, 0.00, 0.00, 0.82),         -- Fără comenzi din cauza stocurilor
(2, '2025-06-23', 1, 35.00, 15.75, 0.00, 0.88),       -- Ploaie - activitate redusă
(2, '2025-06-22', 0, 0.00, 0.00, 0.00, 0.70),         -- Ploaie intensă + echipament defect
(2, '2025-06-21', 2, 125.00, 48.60, 0.00, 0.91),      
(2, '2025-06-20', 3, 190.00, 73.25, 420.00, 0.65),    -- Cu reparație urgentă
(2, '2025-06-19', 4, 280.00, 98.40, 0.00, 0.89),      

-- CaS Dimitrie Cantemir (location_id = 3)
(3, '2025-06-25', 1, 55.00, 22.30, 0.00, 0.88),       -- Azi
(3, '2025-06-24', 2, 140.00, 58.75, 0.00, 0.87),      
(3, '2025-06-23', 1, 75.00, 32.80, 0.00, 0.86),       -- Ploaie
(3, '2025-06-22', 1, 60.00, 28.45, 0.00, 0.82),       -- Ploaie intensă
(3, '2025-06-21', 3, 205.00, 89.15, 0.00, 0.90),      -- Zi recuperare
(3, '2025-06-20', 2, 135.00, 56.25, 0.00, 0.89),      
(3, '2025-06-19', 3, 180.00, 75.60, 0.00, 0.91);      

/*********************************************************************
* 16. EQUIPMENT USAGE LOG (ultimele utilizări pentru efficiency)
*********************************************************************/

INSERT INTO equipment_usage_log (equipment_id, order_id, start_time, end_time, usage_hours, efficiency, notes) VALUES
-- Utilizări recente pentru calculul efficiency
(1, 1, '2025-06-20 10:00:00', '2025-06-20 11:30:00', 1.5, 0.92, 'Curățare covoare VIP - performanță excelentă'),
(1, 4, '2025-06-25 08:00:00', '2025-06-25 10:30:00', 2.5, 0.88, 'Detailing în progres - performanță bună'),

(2, 1, '2025-06-20 10:15:00', '2025-06-20 11:15:00', 1.0, 0.90, 'Aspirare finală covoare'),
(2, 4, '2025-06-25 09:00:00', '2025-06-25 10:00:00', 1.0, 0.85, 'Aspirare auto premium'),

-- Echipament în mentenanță (performanță scăzută înainte)
(3, NULL, '2025-06-22 14:00:00', '2025-06-22 16:30:00', 2.5, 0.65, 'Ultimă utilizare înainte de defectare'),

(5, 2, '2025-06-19 14:00:00', '2025-06-19 15:15:00', 1.25, 0.89, 'Spălare completă BMW X5'),

-- Echipament defect la Herastrau
(7, NULL, '2025-06-20 13:30:00', '2025-06-20 14:00:00', 0.5, 0.30, 'Ultima utilizare înainte de avarie'),

(9, 3, '2025-06-21 09:00:00', '2025-06-21 11:00:00', 2.0, 0.90, 'Curățare chimică costume'),
(10, 3, '2025-06-21 10:30:00', '2025-06-21 11:00:00', 0.5, 0.95, 'Uscare finală costume'),

-- Echipament cu mentenanță programată
(11, NULL, '2025-06-24 15:00:00', '2025-06-24 17:00:00', 2.0, 0.78, 'Aspirare textil - performanță în scădere'),

(12, 6, '2025-06-27 15:00:00', '2025-06-27 16:30:00', 1.5, 0.94, 'Procesare rochie de seară - programat');

/*********************************************************************
* SUCCESS MESSAGE
*********************************************************************/

SELECT 
    '🎉 SEED DATA ENHANCED COMPLET! 🎉' as "STATUS",
    '
📊 DATE INSERATE:
• 17 Utilizatori (4 demo + 13 realiști)
• 3 Locații în București  
• 6 Clienți + 6 Angajați
• 16 Servicii (toate tipurile)
• 18 Resurse diverse
• 54 Intrări inventory (cu alerte)
• 12 Echipamente (3 locații)
• 6 Mentenanțe echipamente
• 8 Comenzi (cu recurrence)
• 4 Transporturi
• 21 Weather snapshots (7 zile × 3 locații)
• 9 Alerte (critice, medii, rezolvate)
• 21 Daily stats (7 zile × 3 locații)
• 12 Equipment usage logs

🔑 CREDENȚIALE DEMO:
• admin@cas.ro / admin123 (ADMIN)
• manager@cas.ro / manager123 (MANAGER)  
• employee@cas.ro / employee123 (EMPLOYEE)
• client@cas.ro / client123 (CUSTOMER)

✅ Sistemul CaS este COMPLET populat!
' as "DETAILS"; 