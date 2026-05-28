# Test script for admin deletion endpoints
# Usage: ./test-deletion-endpoints.ps1

Write-Host "=" * 50
Write-Host "Admin Deletion Endpoints Test"
Write-Host "=" * 50

# Set backend URL
$BACKEND_URL = "http://localhost:3000"
$ADMIN_TOKEN = ""

# Step 1: Get admin token (login as admin)
Write-Host "`n[1] Getting admin token..."
$loginPayload = @{
    email = "admin@signal-moi.com"
    password = "AdminPassword123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BACKEND_URL/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginPayload
    
    $ADMIN_TOKEN = $loginResponse.token
    Write-Host "✓ Admin token retrieved" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get admin token" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# Step 2: Test DELETE /api/admin/signalements/:id
Write-Host "`n[2] Testing DELETE /api/admin/signalements/:id..."
$signalementId = 1  # Replace with actual ID
$deleteSignalementPayload = @{
    reason = "This signalement violates community guidelines"
} | ConvertTo-Json

try {
    $deleteResponse = Invoke-RestMethod -Uri "$BACKEND_URL/api/admin/signalements/$signalementId" `
        -Method DELETE `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $ADMIN_TOKEN" } `
        -Body $deleteSignalementPayload
    
    Write-Host "✓ Signalement deletion successful" -ForegroundColor Green
    Write-Host "Response:" $deleteResponse | ConvertTo-Json
} catch {
    Write-Host "✗ Signalement deletion failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Step 3: Test DELETE /api/admin/campagnes/:id
Write-Host "`n[3] Testing DELETE /api/admin/campagnes/:id..."
$campagneId = 1  # Replace with actual ID
$deleteCampagnePayload = @{
    reason = "Campaign has successfully reached its goal"
} | ConvertTo-Json

try {
    $deleteResponse = Invoke-RestMethod -Uri "$BACKEND_URL/api/admin/campagnes/$campagneId" `
        -Method DELETE `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $ADMIN_TOKEN" } `
        -Body $deleteCampagnePayload
    
    Write-Host "✓ Campaign deletion successful" -ForegroundColor Green
    Write-Host "Response:" $deleteResponse | ConvertTo-Json
} catch {
    Write-Host "✗ Campaign deletion failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Step 4: Test without admin token (should fail)
Write-Host "`n[4] Testing without authentication (should fail)..."
try {
    $deleteResponse = Invoke-RestMethod -Uri "$BACKEND_URL/api/admin/signalements/1" `
        -Method DELETE `
        -ContentType "application/json" `
        -Body $deleteSignalementPayload
    
    Write-Host "✗ Should have failed - endpoint is not protected!" -ForegroundColor Red
} catch {
    Write-Host "✓ Correctly rejected unauthorized request" -ForegroundColor Green
}

# Step 5: Test with non-existent ID (should return 404)
Write-Host "`n[5] Testing with non-existent signalement ID..."
try {
    $deleteResponse = Invoke-RestMethod -Uri "$BACKEND_URL/api/admin/signalements/999999" `
        -Method DELETE `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $ADMIN_TOKEN" } `
        -Body $deleteSignalementPayload
    
    Write-Host "✗ Should have returned 404" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✓ Correctly returned 404 for non-existent signalement" -ForegroundColor Green
    } else {
        Write-Host "✗ Unexpected error:" $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host "`n" + "=" * 50
Write-Host "Tests completed"
Write-Host "=" * 50
