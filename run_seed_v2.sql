-- =====================================================
-- CaS Database Seed v2.0 - Master Script
-- Execută toate părțile seed-ului în ordine
-- =====================================================

\echo ''
\echo '=== ÎNCEPERE SEED CaS v2.0 ==='
\echo ''

-- Part 1: Utilizatori, Locații, Angajați, Clienți
\echo 'Executare Part 1: Utilizatori, Locații, Angajați, Clienți...'
\i seed_v2_part1.sql
\echo 'Part 1 completat.'
\echo ''

-- Part 2: Servicii, Echipamente, Resurse, Inventar
\echo 'Executare Part 2: Servicii, Echipamente, Resurse, Inventar...'
\i seed_v2_part2.sql
\echo 'Part 2 completat.'
\echo ''

-- Part 3: Comenzi, Transport, Mentenanță, Meteo, Notificări
\echo 'Executare Part 3: Comenzi, Transport, Mentenanță, Meteo, Notificări...'
\i seed_v2_part3.sql
\echo 'Part 3 completat.'
\echo ''

-- Part 4: RSS Feeds și Finalizare
\echo 'Executare Part 4: RSS Feeds și Finalizare...'
\i seed_v2_part4.sql
\echo 'Part 4 completat.'
\echo ''

\echo '=== SEED COMPLET FINALIZAT! ==='
\echo ''
\echo 'Baza de date CaS v2.0 este gata pentru utilizare!'
\echo ''
\echo 'Pentru a testa sistemul, folosiți următoarele conturi:'
\echo '- Admin: admin / admin123'
\echo '- Manager: manager1 / manager123'  
\echo '- Angajat: employee1 / employee123'
\echo '- Client: client1 / client123'
\echo '' 