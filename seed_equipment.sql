/*********************************************************************
* CaS – Equipment & Maintenance Seed Data
* Date pentru echipamente și mentenanță - FAZA 8
* Rulează DUPĂ seed_data.sql
*********************************************************************/

-- Clear existing equipment data
DELETE FROM equipment_usage_log;
DELETE FROM equipment_maintenance;
DELETE FROM equipment;

-- Reset sequences
ALTER SEQUENCE equipment_equipment_id_seq RESTART WITH 1;

/*********************************************************************
* EQUIPMENT DATA
*********************************************************************/

INSERT INTO equipment (location_id, name, equipment_type, status, serial_number, manufacturer, model, purchased_on, purchase_price, warranty_until, last_maintenance, next_maintenance, usage_hours, efficiency_score, notes) VALUES
-- CaS Centru (Location 1)
(1, 'Mașină Spălat Covoare Pro', 'CARPET_CLEANER', 'OPERATIVE', 'CC-2023-001', 'CleanMaster', 'CM-500X', '2023-01-15', 15000.00, '2026-01-15', '2025-05-15 10:00:00', '2025-08-15 10:00:00', 1250, 0.95, 'Echipament principal pentru curățare covoare'),
(1, 'Aspirator Industrial V1', 'VACUUM_CLEANER', 'OPERATIVE', 'VC-2023-002', 'PowerClean', 'PC-Industrial-2000', '2023-02-01', 3500.00, '2025-02-01', '2025-04-20 14:00:00', '2025-07-20 14:00:00', 890, 0.92, 'Aspirator de mare putere pentru toate suprafețele'),
(1, 'Mașină Spălat Auto Deluxe', 'PRESSURE_WASHER', 'OPERATIVE', 'PW-2023-003', 'AutoWash', 'AW-Deluxe-300', '2023-03-10', 8500.00, '2025-03-10', '2025-06-01 09:00:00', '2025-09-01 09:00:00', 750, 0.98, 'Sistem complet pentru spălare auto profesională'),
(1, 'Uscător Rapid Pro', 'DRYER', 'OPERATIVE', 'DR-2023-010', 'QuickDry', 'QD-Pro-600', '2023-07-20', 3200.00, '2025-07-20', '2025-06-10 16:00:00', '2025-09-10 16:00:00', 680, 0.89, 'Uscător rapid pentru textile'),

-- CaS Nord (Location 2)
(2, 'Aspirator Industrial V2', 'VACUUM_CLEANER', 'UNDER_MAINTENANCE', 'VC-2023-004', 'PowerClean', 'PC-Industrial-1500', '2023-01-20', 2800.00, '2025-01-20', '2025-06-18 08:00:00', '2025-06-25 08:00:00', 1100, 0.85, 'În mentenanță - zgomot anormal la motor'),
(2, 'Mașină Abur Profesional', 'STEAM_CLEANER', 'OPERATIVE', 'SC-2023-005', 'SteamPro', 'SP-Professional-400', '2023-04-05', 6200.00, '2025-04-05', '2025-05-10 11:00:00', '2025-08-10 11:00:00', 680, 0.90, 'Curățare cu abur pentru dezinfecție'),
(2, 'Uscător Industrial', 'DRYER', 'OUT_OF_SERVICE', 'DR-2023-006', 'DryFast', 'DF-Industrial-800', '2023-02-15', 4500.00, '2025-02-15', '2025-06-10 15:00:00', NULL, 1350, 0.60, 'Defecțiune electronică - necesită reparație urgentă'),
(2, 'Mașină Presiune Compactă V2', 'PRESSURE_WASHER', 'OPERATIVE', 'PW-2023-011', 'CompactWash', 'CW-Compact-200', '2023-08-15', 3500.00, '2024-08-15', '2025-05-30 14:00:00', '2025-08-30 14:00:00', 520, 0.93, 'Echipament pentru spălare la presiune'),

-- CaS Sud (Location 3)
(3, 'Mașină Spălat Covoare Standard', 'CARPET_CLEANER', 'OPERATIVE', 'CC-2023-007', 'CleanMaster', 'CM-300', '2023-05-20', 9500.00, '2026-05-20', '2025-06-05 12:00:00', '2025-09-05 12:00:00', 580, 0.94, 'Versiune standard pentru covoare mici și medii'),
(3, 'Aspirator Portabil Pro', 'VACUUM_CLEANER', 'OPERATIVE', 'VC-2023-008', 'MobileClean', 'MC-Portable-Pro', '2023-06-15', 1200.00, '2024-06-15', '2025-06-15 16:00:00', '2025-09-15 16:00:00', 420, 0.88, 'Aspirator portabil pentru spații mici'),
(3, 'Mașină Presiune Compactă', 'PRESSURE_WASHER', 'OPERATIVE', 'PW-2023-009', 'CompactWash', 'CW-Compact-150', '2023-04-30', 2800.00, '2024-04-30', '2025-05-25 10:30:00', '2025-08-25 10:30:00', 650, 0.91, 'Model compact pentru spații reduse'),
(3, 'Mașină Abur Portabilă', 'STEAM_CLEANER', 'OPERATIVE', 'SC-2023-012', 'SteamMobile', 'SM-Portable-200', '2023-09-10', 2200.00, '2024-09-10', '2025-06-12 11:00:00', '2025-09-12 11:00:00', 380, 0.87, 'Curățare cu abur pentru mobilier delicat');

/*********************************************************************
* EQUIPMENT MAINTENANCE HISTORY
*********************************************************************/

INSERT INTO equipment_maintenance (equipment_id, maintenance_type, status, scheduled_date, started_at, completed_at, technician_name, description, cost, parts_replaced, next_maintenance, unplanned) VALUES
-- Completed maintenance (Historical)
(1, 'PREVENTIVE', 'COMPLETED', '2025-05-15 10:00:00', '2025-05-15 10:15:00', '2025-05-15 12:30:00', 'Ion Vasile', 'Schimbare filtre, verificare pompă, curățare rezervoare', 350.00, 'Filtru principal, filtru secundar', '2025-08-15 10:00:00', false),
(2, 'PREVENTIVE', 'COMPLETED', '2025-04-20 14:00:00', '2025-04-20 14:10:00', '2025-04-20 16:45:00', 'Andrei Stoica', 'Verificare motor, schimbare saci, curățare', 180.00, 'Saci aspirator (5 buc)', '2025-07-20 14:00:00', false),
(3, 'PREVENTIVE', 'COMPLETED', '2025-06-01 09:00:00', '2025-06-01 09:05:00', '2025-06-01 11:20:00', 'Ion Vasile', 'Verificare presiune, schimbare duze, calibrare', 280.00, 'Duze spălare (3 buc)', '2025-09-01 09:00:00', false),
(6, 'PREVENTIVE', 'COMPLETED', '2025-05-10 11:00:00', '2025-05-10 11:20:00', '2025-05-10 13:15:00', 'Cristina Gheorghe', 'Curățare sistem abur, verificare presiune', 220.00, 'Filtru abur', '2025-08-10 11:00:00', false),
(9, 'PREVENTIVE', 'COMPLETED', '2025-06-05 12:00:00', '2025-06-05 12:10:00', '2025-06-05 14:30:00', 'Andrei Stoica', 'Verificare pompă, schimbare filtre, calibrare', 190.00, 'Filtru pompă', '2025-09-05 12:00:00', false),

-- In progress maintenance
(5, 'CORRECTIVE', 'IN_PROGRESS', '2025-06-18 08:00:00', '2025-06-18 08:30:00', NULL, 'Cristina Gheorghe', 'Reparație motor - zgomot anormal la pornire', 450.00, NULL, NULL, true),

-- Scheduled maintenance (Future)
(6, 'PREVENTIVE', 'SCHEDULED', '2025-08-10 11:00:00', NULL, NULL, NULL, 'Mentenanță preventivă trimestrială - verificare sistem abur', NULL, NULL, '2025-11-10 11:00:00', false),
(9, 'PREVENTIVE', 'SCHEDULED', '2025-09-05 12:00:00', NULL, NULL, NULL, 'Verificare pompă și filtre, calibrare presiune', NULL, NULL, '2025-12-05 12:00:00', false),
(1, 'PREVENTIVE', 'SCHEDULED', '2025-08-15 10:00:00', NULL, NULL, NULL, 'Mentenanță trimestrială - verificare completă', NULL, NULL, '2025-11-15 10:00:00', false),
(2, 'PREVENTIVE', 'SCHEDULED', '2025-07-20 14:00:00', NULL, NULL, NULL, 'Schimbare saci, verificare motor', NULL, NULL, '2025-10-20 14:00:00', false),

-- Emergency maintenance for broken equipment
(7, 'EMERGENCY', 'SCHEDULED', '2025-06-25 09:00:00', NULL, NULL, NULL, 'Reparație urgentă - defecțiune electronică completă', 800.00, NULL, NULL, true),

-- Inspection maintenance
(4, 'INSPECTION', 'SCHEDULED', '2025-07-01 10:00:00', NULL, NULL, NULL, 'Inspecție anuală pentru certificare', NULL, NULL, NULL, false),
(8, 'INSPECTION', 'SCHEDULED', '2025-07-15 14:00:00', NULL, NULL, NULL, 'Inspecție de siguranță pentru echipament presiune', NULL, NULL, NULL, false);

/*********************************************************************
* EQUIPMENT USAGE LOG (Sample data pentru efficiency tracking)
*********************************************************************/

INSERT INTO equipment_usage_log (equipment_id, order_id, start_time, end_time, usage_hours, efficiency, notes) VALUES
-- Equipment usage pentru completed orders
(1, 1, '2025-06-18 10:30:00', '2025-06-18 12:00:00', 1.5, 0.95, 'Curățare covor persan - performanță excelentă'),
(3, 2, '2025-06-19 14:15:00', '2025-06-19 15:15:00', 1.0, 0.98, 'Spălare auto completă - rezultat perfect'),
(9, 3, '2025-06-17 09:30:00', '2025-06-17 10:45:00', 1.25, 0.92, 'Curățare mobilier - eficiență bună'),

-- Recent usage (last week)
(1, NULL, '2025-06-17 08:00:00', '2025-06-17 10:30:00', 2.5, 0.94, 'Curățare covoare multiple - performanță stabilă'),
(2, NULL, '2025-06-16 13:00:00', '2025-06-16 15:00:00', 2.0, 0.91, 'Aspirare generală - funcționare normală'),
(3, NULL, '2025-06-15 11:00:00', '2025-06-15 12:30:00', 1.5, 0.97, 'Spălare auto - rezultate foarte bune'),
(6, NULL, '2025-06-14 10:00:00', '2025-06-14 11:45:00', 1.75, 0.89, 'Curățare cu abur - performanță în scădere'),
(9, NULL, '2025-06-13 14:30:00', '2025-06-13 16:00:00', 1.5, 0.93, 'Curățare mobilier - funcționare bună'),

-- Usage data pentru efficiency calculation
(1, NULL, '2025-06-12 09:00:00', '2025-06-12 11:00:00', 2.0, 0.96, 'Test performanță după mentenanță'),
(2, NULL, '2025-06-11 15:00:00', '2025-06-11 16:30:00', 1.5, 0.88, 'Performanță în scădere - necesită atenție'),
(5, NULL, '2025-06-10 08:30:00', '2025-06-10 09:00:00', 0.5, 0.82, 'Ultimă utilizare înainte de defecțiune');

/*********************************************************************
* ALERTS PENTRU EQUIPMENT
*********************************************************************/

INSERT INTO alerts (location_id, equipment_id, severity, alert_type, title, message, created_at) VALUES
-- Equipment alerts
(2, 5, 'WARNING', 'EQUIPMENT_MAINTENANCE', 'Equipment Under Maintenance', 'Aspirator Industrial V2 is currently under maintenance - motor repair in progress', '2025-06-18 08:30:00'),
(2, 7, 'CRITICAL', 'EQUIPMENT_FAILURE', 'Equipment Out of Service', 'Uscător Industrial is out of service due to electronic malfunction - requires emergency repair', '2025-06-10 15:30:00'),
(1, 1, 'INFO', 'MAINTENANCE_DUE', 'Scheduled Maintenance Due', 'Mașină Spălat Covoare Pro has scheduled maintenance due on 2025-08-15', '2025-06-20 10:00:00'),
(1, 2, 'WARNING', 'MAINTENANCE_DUE', 'Maintenance Due Soon', 'Aspirator Industrial V1 maintenance is due in 30 days', '2025-06-20 10:00:00'),
(3, 10, 'INFO', 'MAINTENANCE_SCHEDULED', 'Maintenance Scheduled', 'Preventive maintenance scheduled for Aspirator Portabil Pro', '2025-06-15 16:30:00'),

-- Efficiency alerts
(2, 5, 'WARNING', 'EFFICIENCY_DROP', 'Equipment Efficiency Drop', 'Aspirator Industrial V2 efficiency dropped to 85% - maintenance recommended', '2025-06-17 14:00:00'),
(2, 7, 'CRITICAL', 'EFFICIENCY_CRITICAL', 'Critical Efficiency Drop', 'Uscător Industrial efficiency at 60% - immediate attention required', '2025-06-10 14:00:00');

-- Success message
SELECT 'Equipment seed data inserted successfully! 🎉' as message,
       'Equipment: ' || (SELECT COUNT(*) FROM equipment) || ', ' ||
       'Maintenance Records: ' || (SELECT COUNT(*) FROM equipment_maintenance) || ', ' ||
       'Usage Logs: ' || (SELECT COUNT(*) FROM equipment_usage_log) || ', ' ||
       'Equipment Alerts: ' || (SELECT COUNT(*) FROM alerts WHERE equipment_id IS NOT NULL) as summary; 