$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    email = "newuser@example.com"
    password = "test123"
    firstName = "New"
    lastName = "User"
    role = "EMPLOYEE"
    locationId = 1
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/register" -Method POST -Body $body -Headers $headers
    Write-Host "Registration successful:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Registration failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody"
    }
} 