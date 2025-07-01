-- =====================================================
-- CaS Database Seed v2.0 - Part 2
-- Servicii, Echipamente, Resurse, Inventar
-- =====================================================

-- Reset sequences
ALTER SEQUENCE services_service_id_seq RESTART WITH 1;
ALTER SEQUENCE equipment_equipment_id_seq RESTART WITH 1;
ALTER SEQUENCE resources_resource_id_seq RESTART WITH 1;
ALTER SEQUENCE inventory_inventory_id_seq RESTART WITH 1;

-- =====================================================
-- SERVICII (Services)
-- =====================================================

INSERT INTO services (name, category, description, base_price, duration_minutes, requires_transport, is_active) VALUES
-- Servicii Covoare
('Curățare Covor Standard', 'CARPET', 'Curățare profesională covoare cu aspirare și spălare', 45.00, 120, true, true),
('Curățare Covor Premium', 'CARPET', 'Curățare avansată cu tratament antimicrobian și parfumare', 75.00, 180, true, true),
('Curățare Covor Persian', 'CARPET', 'Curățare specializată pentru covoare persane și orientale', 120.00, 240, true, true),
('Eliminare Pete Covor', 'CARPET', 'Tratament specializat pentru eliminarea petelor dificile', 35.00, 90, false, true),

-- Servicii Spălare Auto
('Spălare Auto Exterioară', 'CAR_WASH', 'Spălare exterioară completă cu ceară de protecție', 35.00, 45, false, true),
('Spălare Auto Completă', 'CAR_WASH', 'Spălare exterioară și curățare interioară', 65.00, 90, false, true),
('Detailing Auto Premium', 'CAR_WASH', 'Serviciu complet de detailing interior și exterior', 150.00, 240, false, true),
('Curățare Tapițerie Auto', 'CAR_WASH', 'Curățare specializată tapițerie și scaune auto', 85.00, 120, false, true),

-- Servicii Îmbrăcăminte
('Curățare Chimică Standard', 'GARMENT', 'Curățare chimică pentru haine delicate', 25.00, 1440, true, true), -- 24h
('Curățare Chimică Express', 'GARMENT', 'Curățare chimică rapidă în 4 ore', 40.00, 240, true, true),
('Curățare Haine Piele', 'GARMENT', 'Tratament specializat pentru articole din piele', 80.00, 2880, true, true), -- 48h
('Spălare și Călcare', 'GARMENT', 'Serviciu complet spălare și călcare haine', 15.00, 720, true, true), -- 12h

-- Servicii Tapițerie
('Curățare Canapea 2 Locuri', 'UPHOLSTERY', 'Curățare profesională canapea 2 locuri', 120.00, 180, true, true),
('Curățare Canapea 3 Locuri', 'UPHOLSTERY', 'Curățare profesională canapea 3 locuri', 180.00, 240, true, true),
('Curățare Fotoliu', 'UPHOLSTERY', 'Curățare profesională fotoliu', 85.00, 120, true, true),
('Impermeabilizare Tapițerie', 'UPHOLSTERY', 'Tratament de impermeabilizare pentru tapițerie', 50.00, 60, false, true),

-- Servicii Diverse
('Curățare Saltea', 'OTHER', 'Curățare și dezinfectare saltea', 95.00, 150, true, true),
('Curățare Perdele', 'OTHER', 'Spălare și călcare perdele', 30.00, 480, true, true), -- 8h
('Curățare Mochetă', 'OTHER', 'Curățare profesională mochetă fixă', 8.00, 30, false, true), -- per m²
('Serviciu Urgență 24h', 'OTHER', 'Serviciu de urgență disponibil 24/7', 200.00, 120, true, true);

-- =====================================================
-- ECHIPAMENTE (Equipment)
-- =====================================================

INSERT INTO equipment (location_id, name, type, manufacturer, model, serial_number, purchase_date, warranty_expiry, status, last_maintenance, next_maintenance, usage_hours, efficiency_rating, notes) VALUES
-- Echipamente Centrul Vechi
(1, 'Mașină Spălat Covoare Pro-1', 'WASHING_MACHINE', 'Karcher', 'BRC 45/45 C', 'KAR001CV2023', '2023-01-15', '2025-01-15', 'OPERATIVE', '2024-11-01', '2025-02-01', 1250, 0.95, 'Echipament principal pentru covoare'),
(1, 'Aspirator Industrial V1', 'VACUUM', 'Nilfisk', 'ATTIX 791-21', 'NIL001CV2023', '2023-02-20', '2025-02-20', 'OPERATIVE', '2024-10-15', '2025-01-15', 980, 0.92, 'Pentru pre-curățare'),
(1, 'Uscător Covoare D1', 'DRYER', 'Dri-Eaz', 'DrizAir 1200', 'DRI001CV2023', '2023-03-10', '2025-03-10', 'OPERATIVE', '2024-11-10', '2025-02-10', 750, 0.88, 'Uscare rapidă covoare'),

-- Echipamente Herastrau
(2, 'Spălător Auto Automat SA-1', 'PRESSURE_WASHER', 'Kärcher', 'HDS 8/18-4 C', 'KAR002HE2023', '2023-01-25', '2025-01-25', 'OPERATIVE', '2024-10-20', '2025-01-20', 1580, 0.97, 'Spălător auto premium'),
(2, 'Mașină Spălat Textile MT-1', 'WASHING_MACHINE', 'Miele', 'PW 6321', 'MIE001HE2023', '2023-02-15', '2025-02-15', 'OPERATIVE', '2024-11-05', '2025-02-05', 1120, 0.94, 'Pentru textile delicate'),
(2, 'Aspirator Profesional V2', 'VACUUM', 'Festool', 'CTL 48 E LE', 'FES001HE2023', '2023-03-05', '2025-03-05', 'MAINTENANCE', '2024-12-01', '2025-03-01', 890, 0.85, 'În mentenanță - înlocuire filtru'),
(2, 'Fier de Călcat Industrial', 'IRON', 'Laurastar', 'S7a', 'LAU001HE2023', '2023-04-12', '2025-04-12', 'OPERATIVE', '2024-10-30', '2025-01-30', 650, 0.91, 'Pentru finisare textile'),

-- Echipamente Berceni
(3, 'Mașină Universală MU-1', 'WASHING_MACHINE', 'Electrolux', 'W5240H', 'ELE001BE2023', '2023-05-08', '2025-05-08', 'OPERATIVE', '2024-11-15', '2025-02-15', 920, 0.89, 'Multifuncțională'),
(3, 'Aspirator Mobil VM-1', 'VACUUM', 'Kärcher', 'NT 65/2 Ap', 'KAR003BE2023', '2023-06-20', '2025-06-20', 'OPERATIVE', '2024-10-25', '2025-01-25', 680, 0.93, 'Pentru servicii mobile'),
(3, 'Echipament Curățare EC-1', 'OTHER', 'Tennant', 'T300', 'TEN001BE2023', '2023-07-15', '2025-07-15', 'OUT_OF_SERVICE', '2024-09-10', '2025-03-10', 450, 0.60, 'Defect motor - în reparație');

-- =====================================================
-- RESURSE/CONSUMABILE (Resources)
-- =====================================================

INSERT INTO resources (name, type, category, unit_of_measure, unit_cost, supplier, is_active) VALUES
-- Detergenți pentru covoare
('Detergent Covoare Universal', 'DETERGENT', 'CARPET_CLEANER', 'LITER', 12.50, 'ChemClean SRL', true),
('Detergent Covoare Premium', 'DETERGENT', 'CARPET_CLEANER', 'LITER', 18.75, 'ProClean Industries', true),
('Soluție Eliminare Pete', 'CHEMICAL', 'STAIN_REMOVER', 'LITER', 25.00, 'StainAway Co.', true),
('Parfum Covoare', 'CHEMICAL', 'FRAGRANCE', 'LITER', 15.30, 'AromaClean', true),

-- Produse spălare auto
('Șampon Auto Standard', 'DETERGENT', 'CAR_SHAMPOO', 'LITER', 8.90, 'AutoClean Pro', true),
('Șampon Auto Premium', 'DETERGENT', 'CAR_SHAMPOO', 'LITER', 14.50, 'CarWash Elite', true),
('Ceară Auto Protecție', 'CHEMICAL', 'CAR_WAX', 'LITER', 32.00, 'WaxPro Ltd', true),
('Soluție Curățare Jante', 'CHEMICAL', 'WHEEL_CLEANER', 'LITER', 18.20, 'WheelShine', true),

-- Produse textile
('Detergent Curățare Chimică', 'DETERGENT', 'DRY_CLEAN', 'LITER', 22.80, 'DryClean Master', true),
('Balsam Textile', 'CHEMICAL', 'FABRIC_SOFTENER', 'LITER', 9.60, 'SoftFabric Co.', true),
('Soluție Antimicrobiană', 'CHEMICAL', 'DISINFECTANT', 'LITER', 16.40, 'SafeClean Ltd', true),

-- Consumabile
('Perii Aspirator Set', 'TOOL', 'VACUUM_BRUSH', 'PIECE', 45.00, 'BrushTech', true),
('Filtre Aspirator Pack 5', 'CONSUMABLE', 'FILTER', 'PACK', 35.80, 'FilterPro', true),
('Lavete Microfibră Pack 10', 'CONSUMABLE', 'CLOTH', 'PACK', 28.50, 'CleanCloth SRL', true),
('Mănuși Protecție Pack 100', 'CONSUMABLE', 'GLOVES', 'PACK', 15.75, 'SafetyFirst', true),
('Saci Gunoi 120L Pack 50', 'CONSUMABLE', 'WASTE_BAG', 'PACK', 12.30, 'EcoBag Co.', true),

-- Resurse speciale
('Apă Demineralizată', 'OTHER', 'WATER', 'LITER', 1.20, 'AquaPure', true),
('Soluție Impermeabilizare', 'CHEMICAL', 'WATERPROOF', 'LITER', 28.90, 'WaterGuard Pro', true),
('Dezinfectant Suprafețe', 'CHEMICAL', 'DISINFECTANT', 'LITER', 11.40, 'CleanSafe Ltd', true);

-- =====================================================
-- RELAȚII SERVICII-RESURSE (Service Resources)
-- =====================================================

INSERT INTO service_resources (service_id, resource_id, quantity_needed, is_optional) VALUES
-- Curățare Covor Standard
(1, 1, 0.5, false), -- Detergent universal
(1, 13, 2, false),  -- Lavete microfibră
(1, 16, 10, false), -- Apă demineralizată

-- Curățare Covor Premium
(2, 2, 0.4, false), -- Detergent premium
(2, 3, 0.2, false), -- Soluție eliminare pete
(2, 4, 0.1, true),  -- Parfum (opțional)
(2, 11, 0.3, false), -- Soluție antimicrobiană

-- Spălare Auto Completă
(6, 5, 0.3, false), -- Șampon auto standard
(6, 7, 0.1, true),  -- Ceară protecție
(6, 13, 1, false),  -- Lavete microfibră

-- Curățare Chimică Standard
(9, 9, 0.8, false), -- Detergent curățare chimică
(9, 10, 0.2, true), -- Balsam textile
(9, 11, 0.1, false); -- Soluție antimicrobiană

-- =====================================================
-- SERVICII DISPONIBILE PER LOCAȚIE (Location Services)
-- =====================================================

INSERT INTO location_services (location_id, service_id, is_available, price_modifier) VALUES
-- Centrul Vechi - toate serviciile de covoare și textile
(1, 1, true, 1.0), (1, 2, true, 1.0), (1, 3, true, 1.0), (1, 4, true, 1.0),
(1, 9, true, 1.0), (1, 10, true, 1.0), (1, 11, true, 1.0), (1, 12, true, 1.0),
(1, 13, true, 1.0), (1, 14, true, 1.0), (1, 15, true, 1.0), (1, 16, true, 1.0),
(1, 17, true, 1.0), (1, 18, true, 1.0), (1, 19, true, 1.0), (1, 20, true, 1.0),

-- Herastrau - premium, auto și textile
(2, 2, true, 1.1), (2, 3, true, 1.1), -- Premium covoare +10%
(2, 5, true, 1.0), (2, 6, true, 1.0), (2, 7, true, 1.0), (2, 8, true, 1.0), -- Auto
(2, 9, true, 1.0), (2, 10, true, 0.9), (2, 11, true, 1.0), (2, 12, true, 1.0), -- Textile
(2, 13, true, 1.1), (2, 14, true, 1.1), (2, 15, true, 1.1), (2, 16, true, 1.1), -- Tapițerie premium
(2, 20, true, 1.0), -- Urgență

-- Berceni - servicii standard
(3, 1, true, 0.9), (3, 4, true, 0.9), -- Covoare standard -10%
(3, 5, true, 0.9), (3, 6, true, 0.9), -- Auto standard -10%
(3, 9, true, 0.9), (3, 12, true, 0.9), -- Textile standard -10%
(3, 17, true, 1.0), (3, 18, true, 1.0), (3, 19, true, 1.0); -- Diverse

-- =====================================================
-- INVENTAR (Inventory)
-- =====================================================

INSERT INTO inventory (location_id, resource_id, current_stock, minimum_stock, maximum_stock, last_restocked, cost_per_unit) VALUES
-- Inventar Centrul Vechi
(1, 1, 45.5, 10.0, 100.0, '2024-12-15', 12.50), -- Detergent universal
(1, 2, 25.2, 5.0, 50.0, '2024-12-10', 18.75),   -- Detergent premium
(1, 3, 8.7, 2.0, 20.0, '2024-12-12', 25.00),    -- Eliminare pete
(1, 4, 12.3, 3.0, 30.0, '2024-12-08', 15.30),   -- Parfum
(1, 9, 35.8, 8.0, 80.0, '2024-12-14', 22.80),   -- Curățare chimică
(1, 11, 18.5, 4.0, 40.0, '2024-12-11', 16.40),  -- Antimicrobian
(1, 13, 15, 5, 50, '2024-12-13', 28.50),         -- Lavete (pack)
(1, 14, 8, 2, 20, '2024-12-09', 15.75),          -- Mănuși (pack)
(1, 16, 120.0, 20.0, 200.0, '2024-12-16', 1.20), -- Apă demineralizată

-- Inventar Herastrau
(2, 2, 38.4, 8.0, 80.0, '2024-12-14', 18.75),   -- Detergent premium
(2, 5, 42.1, 10.0, 100.0, '2024-12-15', 8.90),  -- Șampon auto standard
(2, 6, 28.7, 6.0, 60.0, '2024-12-13', 14.50),   -- Șampon auto premium
(2, 7, 15.3, 3.0, 30.0, '2024-12-10', 32.00),   -- Ceară auto
(2, 8, 22.8, 5.0, 50.0, '2024-12-12', 18.20),   -- Curățare jante
(2, 9, 45.6, 10.0, 100.0, '2024-12-14', 22.80), -- Curățare chimică
(2, 10, 32.4, 8.0, 80.0, '2024-12-11', 9.60),   -- Balsam textile
(2, 13, 25, 8, 80, '2024-12-13', 28.50),         -- Lavete (pack)
(2, 16, 180.0, 30.0, 300.0, '2024-12-16', 1.20), -- Apă demineralizată

-- Inventar Berceni
(3, 1, 28.9, 8.0, 80.0, '2024-12-12', 12.50),   -- Detergent universal
(3, 5, 35.2, 8.0, 80.0, '2024-12-14', 8.90),    -- Șampon auto
(3, 9, 22.5, 5.0, 50.0, '2024-12-10', 22.80),   -- Curățare chimică
(3, 12, 15, 3, 30, '2024-12-11', 35.80),         -- Filtre (pack)
(3, 13, 12, 4, 40, '2024-12-09', 28.50),         -- Lavete (pack)
(3, 15, 8, 2, 20, '2024-12-08', 12.30),          -- Saci gunoi (pack)
(3, 16, 95.0, 15.0, 150.0, '2024-12-15', 1.20),  -- Apă demineralizată
(3, 18, 25.4, 5.0, 50.0, '2024-12-13', 11.40);   -- Dezinfectant suprafețe

-- =====================================================
-- ALERTE INVENTAR (Inventory Alerts)
-- =====================================================

INSERT INTO inventory_alerts (inventory_id, alert_type, message, is_resolved) VALUES
-- Alerte pentru stocuri scăzute
((SELECT inventory_id FROM inventory WHERE location_id = 1 AND resource_id = 3), 'LOW_STOCK', 'Stoc scăzut: Soluție Eliminare Pete - doar 8.7L rămas', false),
((SELECT inventory_id FROM inventory WHERE location_id = 3 AND resource_id = 15), 'LOW_STOCK', 'Stoc scăzut: Saci Gunoi - doar 8 pack-uri rămase', false),
((SELECT inventory_id FROM inventory WHERE location_id = 3 AND resource_id = 13), 'LOW_STOCK', 'Stoc scăzut: Lavete Microfibră - doar 12 pack-uri rămase', false);

-- =====================================================
-- VERIFICARE INSERĂRI
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Seed Part 2 completat cu succes!';
    RAISE NOTICE 'Servicii create: %', (SELECT COUNT(*) FROM services);
    RAISE NOTICE 'Echipamente create: %', (SELECT COUNT(*) FROM equipment);
    RAISE NOTICE 'Resurse create: %', (SELECT COUNT(*) FROM resources);
    RAISE NOTICE 'Inventar creat: %', (SELECT COUNT(*) FROM inventory);
    RAISE NOTICE 'Alerte inventar: %', (SELECT COUNT(*) FROM inventory_alerts);
END $$; 