# CaS - Complete API Collection (Repository Pattern)

## Descriere
Această colecție Postman conține toate endpoint-urile pentru aplicația **Cleaning Web Simulator (CaS)** după implementarea repository pattern. Colecția este organizată pe controller-e și include toate operațiunile CRUD plus funcționalități specifice.

## Structura Colecției

### 🏠 System Endpoints
- **Ping Server** - verifică statusul serverului
- **Scheduler Status** - verifică statusul scheduler-ului

### 🔐 Auth Controller
- **Register User** - înregistrează utilizator nou
- **Login User** - autentificare utilizator

### 📍 Location Controller
- **Get All Locations** - listează toate locațiile
- **Create Location** - creează locație nouă
- **Get Location by ID** - obține locație după ID
- **Update Location** - actualizează locație
- **Delete Location** - șterge locație (soft delete)

### 🛠️ Service Controller
- **Get All Services** - listează toate serviciile
- **Create Service** - creează serviciu nou
- **Get Service by ID** - obține serviciu după ID
- **Update Service** - actualizează serviciu
- **Delete Service** - șterge serviciu

### 👥 Customer Controller
- **Get All Customers** - listează toți clienții
- **Create Customer** - creează client nou
- **Get Customer by ID** - obține client după ID
- **Update Customer** - actualizează client
- **Delete Customer** - șterge client

### 👷 Employee Controller
- **Get All Employees** - listează toți angajații
- **Create Employee** - creează angajat nou
- **Get Employee by ID** - obține angajat după ID
- **Get Employees by Type** - obține angajați după tip
- **Update Employee** - actualizează angajat
- **Delete Employee** - șterge angajat

### 📋 Order Controller
- **Get All Orders** - listează toate comenzile
- **Create Order** - creează comandă nouă cu items
- **Get Order by ID** - obține comandă după ID
- **Update Order** - actualizează comandă
- **Update Order Status** - actualizează statusul comenzii
- **Cancel Order** - anulează comandă

### 🚚 Transport Controller
- **Get All Transports** - listează toate transporturile
- **Create Transport** - creează transport nou
- **Get Active Transports** - obține transporturi active
- **Get Transport by ID** - obține transport după ID
- **Get Transport by Order ID** - obține transport după ID comandă
- **Update Transport** - actualizează transport
- **Update Transport Status** - actualizează statusul transportului
- **Start Transport** - pornește transport
- **Complete Transport** - finalizează transport
- **Cancel Transport** - anulează transport

## Variabile de Colecție

Colecția folosește următoarele variabile pentru a automatiza testarea:

- `baseUrl` - URL-ul de bază al API-ului (implicit: http://localhost:8000)
- `authToken` - token-ul de autentificare (salvat automat la login)
- `userId` - ID-ul utilizatorului (salvat automat la register/login)
- `customerId` - ID-ul clientului (salvat automat la creare)
- `employeeId` - ID-ul angajatului (salvat automat la creare)
- `locationId` - ID-ul locației (salvat automat la creare)
- `serviceId` - ID-ul serviciului (salvat automat la creare)
- `orderId` - ID-ul comenzii (salvat automat la creare)
- `transportId` - ID-ul transportului (salvat automat la creare)

## Cum să folosești colecția

### 1. Import în Postman
1. Deschide Postman
2. Click pe **Import**
3. Selectează fișierul `CaS_Complete_API_Collection.postman_collection.json`
4. Click pe **Import**

### 2. Configurare
1. Asigură-te că serverul CaS rulează pe `http://localhost:8000`
2. Dacă serverul rulează pe alt port, modifică variabila `baseUrl`

### 3. Testare secvențială
Pentru o testare completă, rulează request-urile în această ordine:

#### Pas 1: Verificare sistem
1. **Ping Server**
2. **Scheduler Status**

#### Pas 2: Autentificare
1. **Register User** (salvează automat userId)
2. **Login User** (salvează automat authToken)

#### Pas 3: Creare entități de bază
1. **Create Location** (salvează automat locationId)
2. **Create Service** (salvează automat serviceId)
3. **Create Customer** (salvează automat customerId)
4. **Create Employee** (salvează automat employeeId)

#### Pas 4: Testare CRUD
- Testează operațiunile GET, PUT, DELETE pentru fiecare entitate

#### Pas 5: Workflow complet
1. **Create Order** (cu items, salvează automat orderId)
2. **Create Transport** (pentru comanda creată)
3. **Update Order Status** → "CONFIRMED"
4. **Start Transport**
5. **Update Transport Status** → "IN_TRANSIT"
6. **Complete Transport**
7. **Update Order Status** → "COMPLETED"

## Scripturi de Test Automate

Colecția include scripturi JavaScript care:
- Salvează automat ID-urile în variabile
- Verifică răspunsurile pentru status codes corecte
- Afișează mesaje în consolă pentru debugging

## Exemple de Date

### Register User
```json
{
    "email": "test-123@example.com",
    "password": "password123",
    "full_name": "Test User Repository"
}
```

### Create Order cu Items
```json
{
    "customer_id": 1,
    "location_id": 1,
    "scheduled_for": "2025-06-25T10:00:00Z",
    "transport_needed": true,
    "notes": "Test order from Postman collection",
    "order_items": [
        {
            "service_id": 1,
            "quantity": 2,
            "price": 199.98
        }
    ]
}
```

## Statusuri Valide

### Order Status
- `PENDING`
- `CONFIRMED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`

### Transport Status
- `SCHEDULED`
- `IN_TRANSIT`
- `COMPLETED`
- `CANCELLED`

### Employee Types
- `CLEANER`
- `DRIVER`
- `MANAGER`

### Service Types
- `HOUSE`
- `OFFICE`
- `CARPET`
- `WINDOW`
- `DEEP`

## Troubleshooting

### Erori comune:
1. **500 Internal Server Error** - verifică dacă serverul rulează și baza de date este conectată
2. **404 Not Found** - verifică URL-urile și path-urile
3. **400 Bad Request** - verifică formatul JSON și câmpurile obligatorii
4. **Variables not set** - rulează mai întâi request-urile care salvează ID-urile

### Logs:
Verifică console-ul Postman pentru mesajele de debugging și logs-urile serverului pentru detalii despre erori.

## Repository Pattern Implementation

Această colecție testează implementarea repository pattern unde:
- **Controllers** - gestionează request-urile HTTP
- **Services** - conțin logica de business
- **Repositories** - gestionează accesul la baza de date
- **Database** - PostgreSQL cu schema completă

Toate endpoint-urile au fost testate și funcționează corect după refactoring-ul la repository pattern. 