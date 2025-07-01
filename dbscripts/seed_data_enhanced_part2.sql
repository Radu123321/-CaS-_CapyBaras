/*********************************************************************
* CaS – Enhanced Seed Data v2 - PART 2
* Equipment, Orders, Weather, Alerts & Statistics
*********************************************************************/

/*********************************************************************
* 6. INVENTORY (stocuri realiste cu câteva alerte)
*********************************************************************/

INSERT INTO inventory (location_id, resource_id, quantity, last_restock) VALUES
-- CaS Centrul Vechi (location_id = 1)
(1, 1, 25.5, '2025-06-20 10:00:00'),   -- Detergent Universal
(1, 2, 18.0, '2025-06-20 10:00:00'),   -- Detergent Covoare  
(1, 3, 30.0, '2025-06-20 10:00:00'),   -- Shampoo Auto
(1, 4, 15.0, '2025-06-20 10:00:00'),   -- Detergent Textile
(1, 5, 12.0, '2025-06-20 10:00:00'),   -- Dezinfectant
(1, 6, 6.0, '2025-06-18 14:30:00'),    -- Perie Covoare
(1, 7, 8.0, '2025-06-18 14:30:00'),    -- Perie Auto
(1, 8, 7.0, '2025-06-18 14:30:00'),    -- Perie Textile
(1, 9, 3.0, '2025-06-15 09:00:00'),    -- Aspirator (CRITICAL)
(1, 10, 120.0, '2025-06-21 08:00:00'), -- Apă Demineralizată
(1, 11, 85.0, '2025-06-21 08:00:00'),  -- Soluție Clătire
(1, 12, 20.0, '2025-06-19 16:00:00'),  -- Filtre HEPA
(1, 13, 15.0, '2025-06-19 16:00:00'),  -- Duze Pulverizare
(1, 14, 30.0, '2025-06-19 16:00:00'),  -- Discuri Abrazive
(1, 15, 65.0, '2025-06-21 13:00:00'),  -- Lavete Microfibre
(1, 16, 95.0, '2025-06-21 13:00:00'),  -- Mănuși Nitril
(1, 17, 150.0, '2025-06-21 13:00:00'), -- Pungi Protecție
(1, 18, 280.0, '2025-06-21 13:00:00'), -- Etichete

-- CaS Herastrau (location_id = 2) - stocuri mici pentru a testa alertele
(2, 1, 8.0, '2025-06-15 10:00:00'),    -- Detergent Universal (LOW)
(2, 2, 5.0, '2025-06-15 10:00:00'),    -- Detergent Covoare (CRITICAL)
(2, 3, 0.0, '2025-06-10 10:00:00'),    -- Shampoo Auto (OUT OF STOCK)
(2, 4, 12.0, '2025-06-15 10:00:00'),   -- Detergent Textile
(2, 5, 3.0, '2025-06-15 10:00:00'),    -- Dezinfectant (CRITICAL)
(2, 6, 2.0, '2025-06-12 14:30:00'),    -- Perie Covoare (CRITICAL)
(2, 7, 8.0, '2025-06-12 14:30:00'),    -- Perie Auto
(2, 8, 6.0, '2025-06-12 14:30:00'),    -- Perie Textile
(2, 10, 95.0, '2025-06-18 08:00:00'),  -- Apă Demineralizată
(2, 11, 70.0, '2025-06-18 08:00:00'),  -- Soluție Clătire
(2, 15, 50.0, '2025-06-18 13:00:00'),  -- Lavete Microfibre
(2, 16, 85.0, '2025-06-18 13:00:00'),  -- Mănuși Nitril

-- CaS Dimitrie Cantemir (location_id = 3)
(3, 1, 22.0, '2025-06-19 10:00:00'),   -- Detergent Universal
(3, 2, 16.0, '2025-06-19 10:00:00'),   -- Detergent Covoare
(3, 3, 25.0, '2025-06-19 10:00:00'),   -- Shampoo Auto
(3, 4, 18.0, '2025-06-19 10:00:00'),   -- Detergent Textile
(3, 5, 10.0, '2025-06-19 10:00:00'),   -- Dezinfectant
(3, 6, 5.0, '2025-06-17 14:30:00'),    -- Perie Covoare
(3, 7, 7.0, '2025-06-17 14:30:00'),    -- Perie Auto
(3, 8, 6.0, '2025-06-17 14:30:00'),    -- Perie Textile
(3, 9, 1.0, '2025-06-10 09:00:00'),    -- Aspirator (CRITICAL)
(3, 10, 105.0, '2025-06-20 08:00:00'), -- Apă Demineralizată
(3, 15, 55.0, '2025-06-20 13:00:00'),  -- Lavete Microfibre
(3, 16, 90.0, '2025-06-20 13:00:00');  -- Mănuși Nitril

/*********************************************************************
* 7. EQUIPMENT (echipamente pentru fiecare locație)
*********************************************************************/

INSERT INTO equipment (location_id, name, equipment_type, status, serial_number, manufacturer, model, purchased_on, purchase_price, warranty_until, usage_hours, efficiency_score) VALUES
-- CaS Centrul Vechi
(1, 'Mașină Spălat Covoare Pro', 'CARPET_CLEANER', 'OPERATIVE', 'CC-2024-001', 'CleanMaster', 'CM-500X', '2024-01-15', 8500.00, '2027-01-15', 380, 0.92),
(1, 'Aspirator Industrial Major', 'VACUUM_CLEANER', 'OPERATIVE', 'VC-2024-002', 'VacuumTech', 'VT-3000', '2024-02-10', 3200.00, '2026-02-10', 420, 0.88),
(1, 'Mașină Aburi Textile', 'STEAM_CLEANER', 'UNDER_MAINTENANCE', 'SC-2023-008', 'SteamPro', 'SP-1500', '2023-11-20', 4800.00, '2025-11-20', 680, 0.75),
(1, 'Uscător Industrial Rapid', 'DRYER', 'OPERATIVE', 'DR-2024-003', 'DryFast', 'DF-2000', '2024-03-05', 5500.00, '2026-03-05', 290, 0.95),

-- CaS Herastrau  
(2, 'Sistem Spălare Auto Complete', 'WASHING_MACHINE', 'OPERATIVE', 'WM-2024-004', 'AutoWash', 'AW-Pro', '2024-01-25', 12000.00, '2027-01-25', 450, 0.89),
(2, 'Aspirator Auto Professional', 'VACUUM_CLEANER', 'OPERATIVE', 'VC-2024-005', 'AutoVac', 'AV-800', '2024-02-15', 2800.00, '2026-02-15', 380, 0.91),
(2, 'Mașină Presiune Jet', 'PRESSURE_WASHER', 'OUT_OF_SERVICE', 'PW-2023-010', 'JetClean', 'JC-400', '2023-09-10', 3600.00, '2025-09-10', 820, 0.65),
(2, 'Polizor Caroserie Auto', 'OTHER', 'OPERATIVE', 'PL-2024-006', 'PolishPro', 'PP-150', '2024-04-10', 1800.00, '2026-04-10', 180, 0.93),

-- CaS Dimitrie Cantemir
(3, 'Centrală Curățenie Textile', 'WASHING_MACHINE', 'OPERATIVE', 'WM-2024-007', 'TextileMaster', 'TM-Pro300', '2024-02-20', 9500.00, '2027-02-20', 340, 0.90),
(3, 'Uscător Textile Industrial', 'DRYER', 'OPERATIVE', 'DR-2024-008', 'DryTech', 'DT-500', '2024-03-01', 4200.00, '2026-03-01', 310, 0.87),
(3, 'Aspirator Central Textil', 'VACUUM_CLEANER', 'UNDER_MAINTENANCE', 'VC-2024-009', 'CentralVac', 'CV-1000', '2024-01-30', 3800.00, '2026-01-30', 360, 0.82),
(3, 'Generatoare Abur Premium', 'STEAM_CLEANER', 'OPERATIVE', 'SC-2024-010', 'SteamMax', 'SM-2000', '2024-04-15', 6200.00, '2026-04-15', 220, 0.94);

/*********************************************************************
* 8. EQUIPMENT MAINTENANCE (istoric și programat)
*********************************************************************/

INSERT INTO equipment_maintenance (equipment_id, maintenance_type, status, scheduled_date, started_at, completed_at, technician_name, description, cost, next_maintenance) VALUES
-- Mențenanță completă
(3, 'CORRECTIVE', 'IN_PROGRESS', '2025-06-23 09:00:00', '2025-06-23 09:15:00', NULL, 'Sergiu Reparații', 'Înlocuire pompă abur principală', 850.00, '2025-09-23 09:00:00'),
(7, 'EMERGENCY', 'COMPLETED', '2025-06-20 14:00:00', '2025-06-20 14:30:00', '2025-06-20 18:45:00', 'Ion Tehnic', 'Blocare compresoare - înlocuire sigurante', 420.00, '2025-07-20 10:00:00'),
(11, 'PREVENTIVE', 'SCHEDULED', '2025-06-26 10:00:00', NULL, NULL, 'Maria Service', 'Revizie anuală și curățare filtre', 320.00, '2026-06-26 10:00:00'),

-- Mentenace programată
(1, 'PREVENTIVE', 'SCHEDULED', '2025-07-01 08:00:00', NULL, NULL, 'Echipa CleanMaster', 'Service 6 luni - verificare general', 450.00, '2026-01-01 08:00:00'),
(5, 'INSPECTION', 'SCHEDULED', '2025-06-28 11:00:00', NULL, NULL, 'AutoWash Techs', 'Inspecție garanție și calibrare', 0.00, '2025-12-28 11:00:00'),
(9, 'PREVENTIVE', 'SCHEDULED', '2025-07-05 09:00:00', NULL, NULL, 'TextileMaster Support', 'Mentenanță trimestrială programată', 380.00, '2025-10-05 09:00:00');

/*********************************************************************
* 9. ORDERS (comenzi din ultima lună cu recurrence)
*********************************************************************/

INSERT INTO orders (customer_id, location_id, status, scheduled_for, completed_at, recurrence_rule, transport_needed, total_price, notes) VALUES
-- Comenzi completate recente
(1, 1, 'COMPLETED', '2025-06-20 10:00:00', '2025-06-20 11:30:00', 'WEEKLY', true, 120.00, 'Curățare covoare client VIP - transport inclus'),
(2, 2, 'COMPLETED', '2025-06-19 14:00:00', '2025-06-19 15:15:00', NULL, false, 65.00, 'Spălare completă BMW X5'),
(3, 3, 'COMPLETED', '2025-06-21 09:00:00', '2025-06-21 11:00:00', 'MONTHLY', true, 85.00, 'Curățare chimică costume - livrare acasă'),

-- Comenzi în progres
(4, 1, 'IN_PROGRESS', '2025-06-25 08:00:00', NULL, NULL, false, 150.00, 'Detailing premium Mercedes - în lucru'),
(5, 2, 'SCHEDULED', '2025-06-26 10:00:00', NULL, 'WEEKLY:2', true, 45.00, 'Curățare covoare birou - la 2 săptămâni'),

-- Comenzi programate
(6, 3, 'SCHEDULED', '2025-06-27 15:00:00', NULL, NULL, false, 55.00, 'Curățare rochie de seară pentru eveniment'),
(1, 1, 'PENDING', '2025-06-28 11:00:00', NULL, 'WEEKLY', true, 120.00, 'Recurrence weekly - covoare client VIP'),
(2, 2, 'SCHEDULED', '2025-06-29 16:00:00', NULL, NULL, false, 35.00, 'Spălare exterioară rapidă');

/*********************************************************************
* 10. ORDER ITEMS (detali servicii per comandă)
*********************************************************************/

INSERT INTO order_items (order_id, service_id, quantity, price) VALUES
-- Comanda 1: Curățare covoare
(1, 2, 1, 75.00),   -- Covoare mari
(1, 4, 1, 45.00),   -- Tratament antimucegai

-- Comanda 2: Spălare auto completă  
(2, 6, 1, 65.00),   -- Spălare completă

-- Comanda 3: Curățare chimică
(3, 9, 1, 45.00),   -- Costume
(3, 12, 1, 35.00),  -- Tratament pete
(3, 16, 1, 5.00),   -- Călcat (mică reducere)

-- Comanda 4: Detailing premium
(4, 7, 1, 150.00),  -- Detailing premium

-- Comanda 5: Covoare birou
(5, 1, 1, 45.00),   -- Covoare mici

-- Comanda 6: Rochie seară
(6, 10, 1, 55.00),  -- Rochii de seară

-- Comanda 7: Recurrence covoare
(7, 2, 1, 75.00),   -- Covoare mari
(7, 4, 1, 45.00),   -- Tratament antimucegai

-- Comanda 8: Spălare rapidă
(8, 5, 1, 35.00);   -- Spălare exterioară

/*********************************************************************
* 11. TRANSPORTS (pentru comenzile cu transport)
*********************************************************************/

INSERT INTO transports (order_id, status, driver_name, vehicle_plate, estimated_start, estimated_end, actual_start, actual_end, cost) VALUES
-- Transport completat
(1, 'FINISHED', 'Radu Marin', 'B123CAS', '2025-06-20 09:30:00', '2025-06-20 12:00:00', '2025-06-20 09:45:00', '2025-06-20 11:50:00', 25.00),

-- Transport programat
(3, 'SCHEDULED', 'Ion Vasile', 'B456CAS', '2025-06-27 13:30:00', '2025-06-27 17:00:00', NULL, NULL, 20.00),
(5, 'SCHEDULED', 'Radu Marin', 'B123CAS', '2025-06-26 09:00:00', '2025-06-26 12:00:00', NULL, NULL, 15.00),
(7, 'PLANNED', 'Ion Vasile', 'B456CAS', '2025-06-28 10:30:00', '2025-06-28 13:00:00', NULL, NULL, 25.00);

SELECT 'Enhanced Seed Data Part 2 completed! 📦🚛' as status; 