# 🧽 CaS v2.0 - Complete Postman Collection Documentation

## Overview
Complete Postman collection for **Cleaning and Services v2.0** system with **150+ endpoints** covering all functionality including Authentication, Customer/Employee Management, Orders, Shifts, Maintenance, Recurrences, Exceptions, Equipment, Inventory, Transport, Notifications, Statistics, Weather, RSS, and WebSocket features.

## 🚀 Quick Start

### Environment Variables
Set these variables in your Postman environment:

```json
{
  "baseUrl": "http://localhost:8000",
  "authToken": "",
  "userId": "1",
  "customerId": "1", 
  "employeeId": "1",
  "locationId": "1",
  "serviceId": "1",
  "orderId": "1",
  "shiftId": "1",
  "maintenanceId": "1",
  "recurrenceId": "1",
  "exceptionId": "1",
  "equipmentId": "1",
  "inventoryId": "1",
  "transportId": "1",
  "notificationId": "1"
}
```

## 📋 Collection Structure

### 🏠 System Health & Status (2 endpoints)
- **GET** `/api/ping` - Check server health
- **GET** `/api/scheduler/status` - Check scheduler status

### 🔐 Authentication v2.0 (8 endpoints)
Enhanced authentication with role-based access and profile management.

#### Key Features:
- Username/email login support
- Role-based registration (CUSTOMER, EMPLOYEE, MANAGER, ADMIN)
- Profile management and password changes
- JWT token authentication

#### Example Request Bodies:

**Register Customer:**
```json
{
    "email": "customer@example.com",
    "password": "password123",
    "full_name": "John Customer",
    "role": "CUSTOMER",
    "phone": "+40722123456",
    "address": "Str. Exemplu Nr. 123, Bucuresti",
    "company_name": "John's Business SRL",
    "preferred_location_id": 1
}
```

**Register Employee:**
```json
{
    "email": "employee@cas-system.com",
    "password": "password123",
    "full_name": "Maria Employee",
    "role": "EMPLOYEE",
    "phone": "+40722654321",
    "position": "CLEANER",
    "hourly_rate": 25.50,
    "hire_date": "2025-01-15",
    "location_id": 1,
    "skills": ["carpet_cleaning", "window_cleaning", "car_wash"]
}
```

**Login:**
```json
{
    "email": "customer@example.com",
    "password": "password123"
}
```

### 👥 Customer Management v2.0 (10 endpoints)
Enhanced customer management with loyalty system and VIP features.

#### Key Features:
- Customer codes (CUS-000001 format)
- Loyalty points system
- VIP customer identification
- Company information tracking
- Advanced search and filtering

#### Example Request Bodies:

**Create Customer:**
```json
{
    "user_id": 1,
    "phone": "+40722123456",
    "address": "Str. Florilor Nr. 25, Bucuresti",
    "billing_address": "Str. Florilor Nr. 25, Bucuresti",
    "company_name": "ABC Cleaning Services SRL",
    "preferred_location_id": 1,
    "loyalty_points": 0
}
```

**Update Loyalty Points:**
```json
{
    "points": 150,
    "reason": "Bonus points for completed order"
}
```

### 👷 Employee Management v2.0 (15 endpoints)
Enhanced employee management with skills tracking and availability.

#### Key Features:
- Employee codes (EMP-000001 format)
- Skills management with PostgreSQL arrays
- Position-based filtering (CLEANER, SUPERVISOR, MANAGER)
- Availability tracking
- Location assignment

#### Example Request Bodies:

**Create Employee:**
```json
{
    "user_id": 1,
    "position": "CLEANER",
    "hourly_rate": 28.50,
    "hire_date": "2025-06-25",
    "location_id": 1,
    "skills": ["carpet_cleaning", "window_cleaning", "car_wash", "upholstery_cleaning"],
    "is_available": true,
    "notes": "Experienced cleaner with 3 years in the industry"
}
```

### 📋 Order Management v2.0 (14 endpoints)
Simplified order management with single service per order.

#### Key Features:
- Single service per order model
- Employee assignment
- Order lifecycle tracking
- Transport integration
- Time tracking

#### Example Request Bodies:

**Create Order:**
```json
{
    "customer_id": 1,
    "location_id": 1,
    "service_id": 1,
    "quantity": 1,
    "unit_price": 150.00,
    "scheduled_date": "2025-06-26",
    "scheduled_time": "10:00",
    "pickup_address": "Str. Clientului Nr. 123, Bucuresti",
    "delivery_address": "Str. Clientului Nr. 123, Bucuresti",
    "special_instructions": "Please handle with care - expensive carpet",
    "transport_required": true
}
```

### ⏰ Shift Management v2.0 (16 endpoints)
Complete shift management with scheduling and attendance tracking.

#### Key Features:
- Shift scheduling with conflict detection
- Attendance tracking
- Break duration management
- Overtime calculation
- Weekly schedule views

#### Example Request Bodies:

**Create Shift:**
```json
{
    "employee_id": 1,
    "location_id": 1,
    "shift_date": "2025-06-26",
    "start_time": "08:00",
    "end_time": "16:00",
    "shift_type": "REGULAR",
    "break_duration": 60,
    "notes": "Regular morning shift"
}
```

## 🔧 Request Body Guidelines

### Authentication Headers
Most endpoints require authentication:
```
Authorization: Bearer {{authToken}}
```

### Content Type
All POST/PUT requests use:
```
Content-Type: application/json
```

### Common Parameters
- `limit`: Pagination limit (default: 20)
- `offset`: Pagination offset (default: 0)
- `location_id`: Filter by location
- `date_from`, `date_to`: Date range filtering

### Status Values
- **Order Status**: PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
- **Shift Status**: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
- **Employee Positions**: CLEANER, SUPERVISOR, MANAGER, TECHNICIAN
- **Maintenance Types**: PREVENTIVE, CORRECTIVE, EMERGENCY
- **Exception Severity**: LOW, MEDIUM, HIGH, CRITICAL

## 🧪 Testing Workflow

1. **Start Server**: Test with `/api/ping`
2. **Register Users**: Create customers, employees, managers
3. **Login**: Get authentication tokens
4. **Create Data**: Add customers, employees, services
5. **Create Orders**: Test order lifecycle
6. **Schedule Shifts**: Test shift management
7. **Test Features**: Maintenance, recurrences, exceptions

## 📝 Notes

- All timestamps use ISO 8601 format
- Monetary values use decimal precision (e.g., 25.50)
- Skills are stored as PostgreSQL arrays
- Customer/Employee codes are auto-generated
- Loyalty points are automatically calculated
- All endpoints include proper error handling and validation

## 🔗 Related Files

- `CaS_v2_Complete_API_Collection.postman_collection.json` - Main collection
- `createschema_v2.sql` - Database schema
- `seed_complete_enhanced.sql` - Test data
- `API_ENDPOINTS.md` - API documentation 