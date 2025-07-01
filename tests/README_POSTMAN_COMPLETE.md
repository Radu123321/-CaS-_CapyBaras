# CaS - Complete API Collection README

## 📋 Overview

Această colecție Postman conține **TOATE** endpoint-urile disponibile în sistemul CaS (Cleaning Web Simulator), organizate pe categorii functionale. Colecția include **12 secțiuni principale** cu **85+ endpoint-uri** complete.

## 🚀 Funcționalități Incluse

### ✅ Sisteme Implementate Complete

1. **🏠 System Health** - Verificări de sănătate sistem
2. **🔐 Authentication** - Autentificare utilizatori
3. **🌤️ Weather Management** - Gestionarea datelor meteo și analiza impactului
4. **🔧 Equipment Management** - Lifecycle echipamente și mentenanță
5. **🚨 Alert System** - Sistem multi-canal de alerte
6. **📦 Inventory Management** - Gestionarea resurselor și inventarului
7. **🌐 WebSocket Management** - Comunicare real-time
8. **📡 RSS Feeds** - Feed-uri RSS pentru diferite tipuri de date
9. **📍 Location Management** - CRUD locații
10. **🛠️ Service Management** - CRUD servicii
11. **👥 Customer Management** - CRUD clienți
12. **👷 Employee Management** - CRUD angajați
13. **📋 Order Management** - CRUD comenzi
14. **🚚 Transport Management** - CRUD transport

## 🔧 Configurare și Utilizare

### Variables (Pre-definite)

Colecția include variabile pre-configurate pentru testare rapidă:

```json
{
    "baseUrl": "http://localhost:8000",
    "userId": "1",
    "locationId": "1",
    "serviceId": "1",
    "customerId": "1",
    "employeeId": "1",
    "orderId": "1",
    "transportId": "1",
    "equipmentId": "1",
    "maintenanceId": "1",
    "resourceId": "1",
    "alertId": "1"
}
```

### 🎯 Endpoint-uri Noi (FAZA 8 & 9)

#### Weather Management (8 endpoint-uri)
- `POST /api/weather` - Adaugă snapshot meteo
- `GET /api/weather/current` - Vremea curentă toate locațiile
- `GET /api/weather/location/:id` - Vremea pentru locație specifică
- `GET /api/weather/impact/location/:id/service/:type` - Analiza impactului asupra serviciilor
- `GET /api/weather/recommendations/location/:id` - Recomandări programare
- `POST /api/weather/update-all` - Actualizează toate datele meteo
- `POST /api/weather/check-adverse` - Verifică condiții adverse
- `GET /api/weather/service-types` - Tipuri servicii disponibile

#### Equipment Management (9 endpoint-uri)
- `GET /api/equipment` - Toate echipamentele (cu filtrare)
- `POST /api/equipment` - Creează echipament nou
- `GET /api/equipment/dashboard` - Dashboard echipamente
- `GET /api/equipment/statuses` - Statusuri disponibile
- `POST /api/equipment/check-status` - Verifică status echipamente
- `GET /api/equipment/:id` - Echipament după ID
- `PUT /api/equipment/:id` - Actualizează echipament
- `POST /api/equipment/:id/maintenance` - Programează mentenanță
- `PUT /api/maintenance/:id/complete` - Finalizează mentenanță

#### Alert System (14 endpoint-uri)
- `GET /api/alerts/test-email` - Test email
- `GET /api/alerts/test-smtp` - Test conexiune SMTP
- `POST /api/alerts/equipment-failure` - Alert defecțiune echipament
- `POST /api/alerts/staff-unavailable` - Alert indisponibilitate personal
- `POST /api/alerts/power-outage` - Alert pană curent
- `POST /api/alerts/critical-inventory` - Alert inventar critic
- `POST /api/alerts/transport-delay` - Alert întârziere transport
- `POST /api/alerts/maintenance-due` - Alert mentenanță scadentă
- `GET /api/alerts/history` - Istoric alerte
- `GET /api/alerts/stats` - Statistici livrare
- `GET /api/alerts/types` - Tipuri alerte disponibile
- `GET /api/alerts/config` - Configurație alerte
- `POST /api/alerts/config` - Actualizează configurație
- `GET /api/alerts/:alertId` - Alert după ID
- `DELETE /api/alerts/history` - Șterge alerte vechi

## 📊 Body Examples - Exemple Complete

### Weather Data
```json
{
    "location_id": 1,
    "temperature_c": 22.5,
    "humidity_pct": 68,
    "condition": "partly cloudy",
    "wind_speed": 15.2,
    "precipitation": 0.0,
    "captured_at": "2025-06-20T14:30:00Z"
}
```

### Equipment Creation
```json
{
    "location_id": 1,
    "name": "Industrial Vacuum Cleaner Pro-X5000",
    "status": "OPERATIVE",
    "purchased_on": "2025-01-15",
    "notes": "High-power industrial vacuum for heavy-duty carpet cleaning operations"
}
```

### Alert Configuration
```json
{
    "email_enabled": true,
    "websocket_enabled": true,
    "rss_enabled": true,
    "default_email_recipients": [
        "admin@cas-system.com",
        "manager@cas-system.com",
        "operations@cas-system.com"
    ],
    "severity_thresholds": {
        "equipment_failure": "CRITICAL",
        "staff_unavailable": "WARNING",
        "inventory_low": "INFO",
        "weather_adverse": "WARNING",
        "transport_delay": "INFO"
    },
    "notification_intervals": {
        "critical": 15,
        "warning": 60,
        "info": 240
    }
}
```

### Order with Items
```json
{
    "customer_id": 1,
    "location_id": 1,
    "scheduled_for": "2025-06-25T10:00:00Z",
    "transport_needed": true,
    "notes": "VIP customer - Premium carpet cleaning service with stain protection. Pet-safe products required.",
    "priority": "HIGH",
    "order_items": [
        {
            "service_id": 1,
            "quantity": 3,
            "price": 449.97,
            "notes": "Living room, bedroom, and hallway carpets"
        }
    ]
}
```

## 🔄 Workflow de Testare Recomandat

### 1. Setup Initial
1. **System Health** - Verifică că serverul rulează
2. **Authentication** - Înregistrează/autentifică utilizator

### 2. Date de Bază
1. **Locations** - Creează locații
2. **Services** - Creează servicii
3. **Customers** - Creează clienți
4. **Employees** - Creează angajați

### 3. Operațiuni Avansate
1. **Equipment** - Adaugă echipamente și programează mentenanță
2. **Weather** - Adaugă date meteo și testează impactul
3. **Inventory** - Gestionează resurse și stocuri
4. **Orders** - Creează comenzi complete
5. **Transports** - Gestionează transportul

### 4. Monitorizare
1. **Alerts** - Testează sistemul de alerte
2. **WebSocket** - Testează comunicarea real-time
3. **RSS** - Verifică feed-urile RSS

## 🎯 Caracteristici Speciale

### Body-uri Realiste
- Toate request-urile au body-uri complete și realiste
- Date de test cu sens în contextul unei companii de curățenie
- Utilizare de variabile Postman pentru consistență

### Organizare Logică
- Endpoint-urile sunt grupate pe funcționalități
- Descrieri clare pentru fiecare secțiune
- Nume descriptive pentru fiecare request

### Variables Dinamice
- Utilizare de `{{$randomInt}}`, `{{$randomFirstName}}`, etc.
- Variables pentru ID-uri pentru testare cross-endpoint
- BaseURL configurabil

## 🚨 Notă Importantă

Această colecție acoperă **100%** din endpoint-urile disponibile în sistemul CaS. Pentru testare completă, asigură-te că:

1. Serverul rulează pe `http://localhost:8000`
2. Baza de date PostgreSQL este configurată
3. Schema este creată cu `createschema_enhanced.sql`
4. Toate serviciile (SMTP, WebSocket, etc.) sunt active

## 📝 Ultima Actualizare

**Data:** 20 Iunie 2025  
**Versiune:** Complete API Collection v2.0  
**Status:** ✅ FAZA 8 & 9 - Complete  
**Endpoint-uri Totale:** 85+  
**Sisteme Integrate:** Weather, Equipment, Alerts, Inventory, WebSocket, RSS + toate CRUD-urile 