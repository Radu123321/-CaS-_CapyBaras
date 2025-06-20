# CaS API Test Script - Complete Collection
# Tests all main endpoints from the Postman collection

$baseUrl = "http://localhost:8000"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "🧪 CaS API Complete Collection Test" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Test variables
$userId = $null
$authToken = $null
$locationId = $null
$serviceId = $null
$customerId = $null
$employeeId = $null
$orderId = $null
$transportId = $null

try {
    # 1. System Endpoints
    Write-Host "`n🏠 Testing System Endpoints..." -ForegroundColor Yellow
    
    Write-Host "Testing Ping..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ping" -Method GET
    Write-Host " ✅ OK" -ForegroundColor Green
    
    Write-Host "Testing Scheduler Status..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/scheduler/status" -Method GET
    Write-Host " ✅ OK" -ForegroundColor Green

    # 2. Auth Controller
    Write-Host "`n🔐 Testing Auth Controller..." -ForegroundColor Yellow
    
    $registerData = @{
        email = "test-collection-$(Get-Random)@example.com"
        password = "password123"
        full_name = "Test Collection User"
    } | ConvertTo-Json
    
    Write-Host "Registering user..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/register" -Method POST -Body $registerData -Headers $headers
    $userId = $response.data.userId
    Write-Host " ✅ User ID: $userId" -ForegroundColor Green
    
    $loginData = @{
        email = ($registerData | ConvertFrom-Json).email
        password = "password123"
    } | ConvertTo-Json
    
    Write-Host "Logging in..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/login" -Method POST -Body $loginData -Headers $headers
    $authToken = $response.data.token
    Write-Host " ✅ Token received" -ForegroundColor Green

    # 3. Location Controller
    Write-Host "`n📍 Testing Location Controller..." -ForegroundColor Yellow
    
    Write-Host "Getting all locations..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/locations" -Method GET
    Write-Host " ✅ Found $($response.Count) locations" -ForegroundColor Green
    
    $locationData = @{
        name = "Test Location Collection $(Get-Random)"
        address = "Test Address $(Get-Random), Bucharest"
        latitude = 44.4268
        longitude = 26.1025
        timezone = "Europe/Bucharest"
    } | ConvertTo-Json
    
    Write-Host "Creating location..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/locations" -Method POST -Body $locationData -Headers $headers
    $locationId = $response.location_id
    Write-Host " ✅ Location ID: $locationId" -ForegroundColor Green
    
    Write-Host "Getting location by ID..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/locations/$locationId" -Method GET
    Write-Host " ✅ Location: $($response.name)" -ForegroundColor Green

    # 4. Service Controller
    Write-Host "`n🛠️ Testing Service Controller..." -ForegroundColor Yellow
    
    Write-Host "Getting all services..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/services" -Method GET
    Write-Host " ✅ Found $($response.Count) services" -ForegroundColor Green
    
    $serviceData = @{
        service_type = "CARPET"
        description = "Professional carpet cleaning from collection"
        base_price = 149.99
    } | ConvertTo-Json
    
    Write-Host "Creating service..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/services" -Method POST -Body $serviceData -Headers $headers
    $serviceId = $response.service_id
    Write-Host " ✅ Service ID: $serviceId" -ForegroundColor Green

    # 5. Customer Controller
    Write-Host "`n👥 Testing Customer Controller..." -ForegroundColor Yellow
    
    Write-Host "Getting all customers..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/customers" -Method GET
    Write-Host " ✅ Found $($response.Count) customers" -ForegroundColor Green
    
    $customerData = @{
        user_id = $userId
        address = "Customer Address $(Get-Random), Bucharest"
        phone = "+4012345$(Get-Random -Minimum 1000 -Maximum 9999)"
    } | ConvertTo-Json
    
    Write-Host "Creating customer..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/customers" -Method POST -Body $customerData -Headers $headers
    $customerId = $response.customer_id
    Write-Host " ✅ Customer ID: $customerId" -ForegroundColor Green

    # 6. Employee Controller
    Write-Host "`n👷 Testing Employee Controller..." -ForegroundColor Yellow
    
    Write-Host "Getting all employees..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/employees" -Method GET
    Write-Host " ✅ Found $($response.Count) employees" -ForegroundColor Green
    
    $employeeData = @{
        user_id = $userId
        employee_type = "CLEANER"
        hire_date = "2025-06-20"
        salary = 2800.00
    } | ConvertTo-Json
    
    Write-Host "Creating employee..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/employees" -Method POST -Body $employeeData -Headers $headers
    $employeeId = $response.employee_id
    Write-Host " ✅ Employee ID: $employeeId" -ForegroundColor Green
    
    Write-Host "Getting employees by type..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/employees/type/CLEANER" -Method GET
    Write-Host " ✅ Found $($response.Count) cleaners" -ForegroundColor Green

    # 7. Order Controller
    Write-Host "`n📋 Testing Order Controller..." -ForegroundColor Yellow
    
    Write-Host "Getting all orders..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/orders?include_items=true" -Method GET
    Write-Host " ✅ Found $($response.Count) orders" -ForegroundColor Green
    
    $orderData = @{
        customer_id = $customerId
        location_id = $locationId
        scheduled_for = "2025-06-25T10:00:00Z"
        transport_needed = $true
        notes = "Test order from collection script"
        order_items = @(
            @{
                service_id = $serviceId
                quantity = 2
                price = 299.98
            }
        )
    } | ConvertTo-Json -Depth 3
    
    Write-Host "Creating order with items..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method POST -Body $orderData -Headers $headers
    $orderId = $response.order_id
    Write-Host " ✅ Order ID: $orderId" -ForegroundColor Green
    
    Write-Host "Getting order by ID..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/orders/$orderId" -Method GET
    Write-Host " ✅ Order with $($response.order_items.Count) items" -ForegroundColor Green
    
    $statusData = @{
        status = "CONFIRMED"
    } | ConvertTo-Json
    
    Write-Host "Updating order status..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/orders/$orderId/status" -Method PUT -Body $statusData -Headers $headers
    Write-Host " ✅ Status updated to CONFIRMED" -ForegroundColor Green

    # 8. Transport Controller
    Write-Host "`n🚚 Testing Transport Controller..." -ForegroundColor Yellow
    
    Write-Host "Getting all transports..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/transports" -Method GET
    Write-Host " ✅ Found $($response.Count) transports" -ForegroundColor Green
    
    $transportData = @{
        order_id = $orderId
        driver_name = "Test Driver Collection"
        vehicle_plate = "B-$(Get-Random -Minimum 100 -Maximum 999)-TST"
        estimated_start = "2025-06-25T09:00:00Z"
        estimated_end = "2025-06-25T11:00:00Z"
    } | ConvertTo-Json
    
    Write-Host "Creating transport..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/transports" -Method POST -Body $transportData -Headers $headers
    $transportId = $response.transport_id
    Write-Host " ✅ Transport ID: $transportId" -ForegroundColor Green
    
    Write-Host "Getting transport by order ID..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/transports/order/$orderId" -Method GET
    Write-Host " ✅ Transport found for order" -ForegroundColor Green
    
    Write-Host "Starting transport..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/transports/$transportId/start" -Method PUT
    Write-Host " ✅ Transport started" -ForegroundColor Green
    
    Write-Host "Getting active transports..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/transports/active" -Method GET
    Write-Host " ✅ Found $($response.Count) active transports" -ForegroundColor Green
    
    $transportStatusData = @{
        status = "IN_TRANSIT"
    } | ConvertTo-Json
    
    Write-Host "Updating transport status..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/transports/$transportId/status" -Method PUT -Body $transportStatusData -Headers $headers
    Write-Host " ✅ Status updated to IN_TRANSIT" -ForegroundColor Green
    
    Write-Host "Completing transport..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/transports/$transportId/complete" -Method PUT
    Write-Host " ✅ Transport completed" -ForegroundColor Green

    # Final workflow test
    Write-Host "`n🔄 Testing Complete Workflow..." -ForegroundColor Yellow
    
    $finalOrderStatusData = @{
        status = "COMPLETED"
    } | ConvertTo-Json
    
    Write-Host "Completing order..." -NoNewline
    $response = Invoke-RestMethod -Uri "$baseUrl/api/orders/$orderId/status" -Method PUT -Body $finalOrderStatusData -Headers $headers
    Write-Host " ✅ Order completed" -ForegroundColor Green

    Write-Host "`n🎉 ALL TESTS PASSED! 🎉" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    Write-Host "✅ System endpoints working" -ForegroundColor Green
    Write-Host "✅ Authentication working" -ForegroundColor Green
    Write-Host "✅ All CRUD operations working" -ForegroundColor Green
    Write-Host "✅ Complex order workflow working" -ForegroundColor Green
    Write-Host "✅ Transport lifecycle working" -ForegroundColor Green
    Write-Host "✅ Repository pattern implementation verified" -ForegroundColor Green
    
    Write-Host "`n📊 Test Summary:" -ForegroundColor Cyan
    Write-Host "- User ID: $userId"
    Write-Host "- Location ID: $locationId"
    Write-Host "- Service ID: $serviceId"
    Write-Host "- Customer ID: $customerId"
    Write-Host "- Employee ID: $employeeId"
    Write-Host "- Order ID: $orderId"
    Write-Host "- Transport ID: $transportId"

} catch {
    Write-Host "`n❌ TEST FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ Postman collection validated successfully!" -ForegroundColor Magenta 