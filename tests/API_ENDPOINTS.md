# CaS API Endpoints - Complete Documentation

## 📋 **Overview**
Această documentație descrie toate endpoint-urile disponibile în sistemul CaS (Cleaning Web Simulator).

**Base URL:** `http://localhost:8000`

---

## 🔐 **Authentication**

### Register User
- **POST** `/api/register`
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "123456",
  "full_name": "Full Name"
}
```
- **Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

### Login User
- **POST** `/api/login`
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```
- **Response:** `200 OK`
```json
{
  "token": "jwt_token_here",
  "userId": 1
}
```

### Ping
- **GET** `/api/ping`
- **Response:** `200 OK`
```json
{
  "status": "ok"
}
```

---

## 📍 **Locations CRUD**

### Create Location
- **POST** `/api/locations`
- **Body:**
```json
{
  "name": "Centrul Bucuresti",
  "address": "Piata Universitatii 1, Bucuresti",
  "latitude": 44.4355,
  "longitude": 26.1025
}
```

### Get All Locations
- **GET** `/api/locations`
- **Query Params:** 
  - `include_inactive=true` (optional)

### Get Location by ID
- **GET** `/api/locations/:id`

### Update Location
- **PUT** `/api/locations/:id`
- **Body:**
```json
{
  "name": "Updated Name",
  "address": "Updated Address"
}
```

### Delete Location (Soft Delete)
- **DELETE** `/api/locations/:id`
- Marks location as `is_active = false`

---

## 🛠️ **Services CRUD**

### Create Service
- **POST** `/api/services`
- **Body:**
```json
{
  "service_type": "CARPET",
  "description": "Professional carpet cleaning",
  "base_price": 150.00
}
```
- **Valid service_type values:** `CARPET`, `CAR_WASH`, `GARMENT`, `OTHER`

### Get All Services
- **GET** `/api/services`

### Get Service by ID
- **GET** `/api/services/:id`

### Update Service
- **PUT** `/api/services/:id`
- **Body:**
```json
{
  "description": "Updated description",
  "base_price": 180.00
}
```

### Delete Service
- **DELETE** `/api/services/:id`
- Hard delete from database

---

## 👥 **Customers CRUD**

### Create Customer
- **POST** `/api/customers`
- **Body:**
```json
{
  "user_id": 5,
  "address": "Str. Demo 123, Bucuresti",
  "phone": "+40123456789"
}
```

### Get All Customers
- **GET** `/api/customers`
- Returns customers with user information (JOIN)

### Get Customer by ID
- **GET** `/api/customers/:id`

### Update Customer
- **PUT** `/api/customers/:id`
- **Body:**
```json
{
  "address": "Updated Address",
  "phone": "+40987654321"
}
```

### Delete Customer
- **DELETE** `/api/customers/:id`
- Hard delete from database

---

## 👷 **Employees CRUD**

### Create Employee
- **POST** `/api/employees`
- **Body:**
```json
{
  "user_id": 5,
  "employee_type": "CLEANER",
  "hire_date": "2025-06-20",
  "salary": 3000
}
```
- **Valid employee_type values:** `CLEANER`, `DRIVER`, `ADMIN`, `MANAGER`

### Get All Employees
- **GET** `/api/employees`
- **Query Params:**
  - `include_inactive=true` (optional) - includes soft-deleted employees

### Get Employee by ID
- **GET** `/api/employees/:id`

### Get Employees by Type
- **GET** `/api/employees/type/:type`
- **Example:** `/api/employees/type/CLEANER`

### Update Employee
- **PUT** `/api/employees/:id`
- **Body:**
```json
{
  "salary": 3500,
  "employee_type": "MANAGER",
  "is_active": true
}
```

### Delete Employee (Soft Delete)
- **DELETE** `/api/employees/:id`
- Marks employee as `is_active = false`

---

## 🚨 **Error Responses**

### 400 Bad Request
```json
{
  "error": "Missing required fields: email, password, full_name"
}
```

### 401 Unauthorized
```json
{
  "error": "Authorization required"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Customer already exists for this user"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create resource"
}
```

---

## 📊 **Database Schema**

### Users
- `user_id` (PK)
- `email` (unique)
- `password_hash`
- `full_name`
- `default_role`
- `is_active`
- `created_at`

### Customers
- `customer_id` (PK)
- `user_id` (FK → users)
- `address`
- `phone`
- `created_at`

### Employees
- `employee_id` (PK)
- `user_id` (FK → users)
- `employee_type` (ENUM)
- `hire_date`
- `salary`
- `is_active`
- `created_at`

### Locations
- `location_id` (PK)
- `name`
- `address`
- `latitude`
- `longitude`
- `timezone`
- `is_active`
- `created_at`

### Services
- `service_id` (PK)
- `service_type` (ENUM)
- `description`
- `base_price`

---

## 🧪 **Testing with Postman**

Colecția Postman `CaS.postman_collection.json` include:

1. **Teste automate** pentru toate endpoint-urile
2. **Validări de răspuns** (status codes, structură JSON)
3. **Gestionare variabile** (userId, customerId, employeeId, etc.)
4. **Teste de erori** (tipuri invalide, resurse inexistente)
5. **Fluxuri complete** (create → read → update → delete)

### Ordinea recomandată de testare:
1. Ping
2. Register → Login
3. Create Location → Get Locations → Update → Delete
4. Create Services → Get Services → Update → Delete  
5. Create Customer → Get Customers → Update → Delete
6. Create Employee → Get Employees → Update → Delete
7. Test validări și erori

---

## 🔧 **Technical Details**

- **Framework:** None (pure Node.js)
- **Database:** PostgreSQL
- **Authentication:** Custom JWT-like tokens with HMAC-SHA256
- **Password Hashing:** PBKDF2 (310,000 iterations)
- **Security:** Parameterized queries, input validation
- **Logging:** Daily rotating logs in `logs/` directory

---

## 📈 **Status**

✅ **Completed Features:**
- Authentication (register/login)
- Locations CRUD
- Services CRUD  
- Customers CRUD
- Employees CRUD
- Comprehensive testing suite
- Input validation
- Error handling
- Database relationships

✅ **Faza 4 Completed:**
- Orders management
- Transport system
- Recurrence patterns
- Scheduler jobs

---

## 📦 **Orders Management**

### Create Order
- **POST** `/api/orders`
- **Body:**
```json
{
  "customer_id": 1,
  "location_id": 1,
  "scheduled_for": "2025-06-25T10:00:00Z",
  "recurrence_rule": "WEEKLY",
  "transport_needed": true,
  "notes": "Weekly carpet cleaning",
  "order_items": [
    {
      "service_id": 1,
      "quantity": 2,
      "price": "150.00"
    }
  ]
}
```
- **Recurrence rules:** `DAILY`, `WEEKLY`, `MONTHLY`, `WEEKLY:2` (every 2 weeks)

### Get All Orders
- **GET** `/api/orders`
- **Query Params:**
  - `status=PENDING` - filter by status
  - `customer_id=1` - filter by customer
  - `location_id=2` - filter by location
  - `include_items=true` - include order items

### Get Order by ID
- **GET** `/api/orders/:id`
- Returns order with items and transport info

### Update Order
- **PUT** `/api/orders/:id`
- **Body:**
```json
{
  "scheduled_for": "2025-06-26T10:00:00Z",
  "notes": "Updated notes",
  "transport_needed": false
}
```

### Update Order Status
- **PUT** `/api/orders/:id/status`
- **Body:**
```json
{
  "status": "CONFIRMED"
}
```
- **Valid statuses:** `PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

### Cancel Order
- **DELETE** `/api/orders/:id/cancel`
- Sets status to CANCELLED and cancels associated transport

---

## 🚚 **Transport Management**

### Create Transport
- **POST** `/api/transports`
- **Body:**
```json
{
  "order_id": 1,
  "driver_name": "Ion Popescu",
  "vehicle_plate": "B123ABC",
  "estimated_start": "2025-06-25T09:30:00Z",
  "estimated_end": "2025-06-25T11:30:00Z"
}
```

### Get All Transports
- **GET** `/api/transports`
- **Query Params:**
  - `status=SCHEDULED` - filter by status
  - `driver_name=Ion` - filter by driver

### Get Transport by ID
- **GET** `/api/transports/:id`

### Get Transport by Order ID
- **GET** `/api/transports/order/:orderId`

### Update Transport
- **PUT** `/api/transports/:id`
- **Body:**
```json
{
  "driver_name": "Updated Driver",
  "vehicle_plate": "B456DEF",
  "estimated_start": "2025-06-25T10:00:00Z"
}
```

### Update Transport Status
- **PUT** `/api/transports/:id/status`
- **Body:**
```json
{
  "status": "IN_TRANSIT"
}
```
- **Valid statuses:** `NOT_REQUIRED`, `SCHEDULED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`

### Start Transport
- **PUT** `/api/transports/:id/start`
- Sets status to IN_TRANSIT and records actual_start time

### Complete Transport
- **PUT** `/api/transports/:id/complete`
- Sets status to DELIVERED and records actual_end time

### Cancel Transport
- **DELETE** `/api/transports/:id/cancel`
- Sets status to CANCELLED

### Get Active Transports
- **GET** `/api/transports/active`
- Returns transports with SCHEDULED or IN_TRANSIT status

---

## ⏰ **Scheduler Management**

### Get Scheduler Status
- **GET** `/api/scheduler/status`
- Returns scheduler status and job information

**Scheduler Jobs:**
- `expandRecurrences` - Runs every 5 minutes to create recurring orders
- Processes orders with recurrence rules (DAILY, WEEKLY, MONTHLY)
- Creates new orders based on scheduling patterns

---

## 📊 **Updated Summary**

**Total endpoints: 38**
- Authentication: 2
- Locations: 5  
- Services: 5
- Customers: 5
- Employees: 6
- Orders: 6
- Transports: 10
- Scheduler: 1
- Utility: 1 (ping)

**Database Tables:**
- `orders` - Main order records
- `order_items` - Service items per order
- `transports` - Transport/delivery records

**Key Features:**
- ✅ Complete CRUD for all entities
- ✅ Recurring order patterns
- ✅ Transport lifecycle management
- ✅ Automated job scheduling
- ✅ Comprehensive test suite (38 endpoints)
- ✅ Real-time status tracking
- ✅ Business logic validation 