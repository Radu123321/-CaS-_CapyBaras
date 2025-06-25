# CaS API Testing Script
# Testează toate endpoint-urile API din documentație

Write-Host "=== TESTARE COMPLETĂ API CaS ===" -ForegroundColor Green
Write-Host "Base URL: http://localhost:8000" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8000"

# Test 1: Ping
Write-Host "1. Testing /api/ping..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/ping" -Method GET
    Write-Host "✅ Ping: " -NoNewline -ForegroundColor Green
    Write-Host $response.status -ForegroundColor White
} catch {
    Write-Host "❌ Ping failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Locations
Write-Host "2. Testing /api/locations..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/locations" -Method GET
    Write-Host "✅ Locations: " -NoNewline -ForegroundColor Green
    Write-Host "Success=$($response.success), Data count=$($response.data.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ Locations failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Services
Write-Host "3. Testing /api/services..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/services" -Method GET
    Write-Host "✅ Services: " -NoNewline -ForegroundColor Green
    Write-Host "Success=$($response.success), Data count=$($response.data.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ Services failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Orders
Write-Host "4. Testing /api/orders..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method GET
    Write-Host "✅ Orders: " -NoNewline -ForegroundColor Green
    Write-Host "Success=$($response.success), Data count=$($response.data.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ Orders failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Customers
Write-Host "5. Testing /api/customers..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/customers" -Method GET
    Write-Host "✅ Customers: " -NoNewline -ForegroundColor Green
    Write-Host "Success=$($response.success), Data count=$($response.data.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ Customers failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Employees
Write-Host "6. Testing /api/employees..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/employees" -Method GET
    Write-Host "✅ Employees: " -NoNewline -ForegroundColor Green
    Write-Host "Success=$($response.success), Data count=$($response.data.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ Employees failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Equipment
Write-Host "7. Testing /api/equipment..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/equipment" -Method GET
    Write-Host "✅ Equipment: " -NoNewline -ForegroundColor Green
    Write-Host "Success=$($response.success), Data count=$($response.data.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ Equipment failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Transports
Write-Host "8. Testing /api/transports..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/transports" -Method GET
    Write-Host "✅ Transports: " -NoNewline -ForegroundColor Green
    Write-Host "Success=$($response.success), Data count=$($response.data.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ Transports failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TESTARE COMPLETĂ ===" -ForegroundColor Green
Write-Host "Pentru teste mai detaliate, folosește Postman cu colecția:" -ForegroundColor Cyan
Write-Host "CaS.postman_collection.json" -ForegroundColor White

# Test POST - Create Location
Write-Host ""
Write-Host "9. Testing POST /api/locations (Create)..." -ForegroundColor Yellow
try {
    $newLocation = @{
        name = "Test Location"
        address = "Strada Test 123, Bucuresti"
        latitude = 44.4355
        longitude = 26.1025
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/locations" -Method POST -Body $newLocation -ContentType "application/json"
    Write-Host "✅ Create Location: " -NoNewline -ForegroundColor Green
    Write-Host "Success=$($response.success)" -ForegroundColor White
} catch {
    Write-Host "❌ Create Location failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Dashboard
Write-Host ""
Write-Host "10. Testing Dashboard..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/dashboard.html" -Method GET
    Write-Host "✅ Dashboard: " -NoNewline -ForegroundColor Green
    Write-Host "Status=$($response.StatusCode)" -ForegroundColor White
} catch {
    Write-Host "❌ Dashboard failed: $($_.Exception.Message)" -ForegroundColor Red
} 