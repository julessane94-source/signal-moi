# Test Campaign Creation on Render API

$API_URL = "https://signal-moi-api.onrender.com"
$EMAIL = "collab@test.com"
$PASSWORD = "Collab@1234!"

Write-Host "Step 1: Login" -ForegroundColor Cyan

try {
    $loginBody = @{
        email = $EMAIL
        password = $PASSWORD
    } | ConvertTo-Json
    
    $loginResponse = Invoke-WebRequest -Uri "$API_URL/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody | ConvertFrom-Json
    
    $token = $loginResponse.token
    Write-Host "Success - Token: $($token.Substring(0,20))..." -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 2: Create Campaign" -ForegroundColor Cyan

try {
    $campaignBody = @{
        titre = "Test Campaign $(Get-Date -Format 'HHmmss')"
        description = "Test campaign from PowerShell"
        type = "atelier"
        lieu = "Paris"
        date_debut = (Get-Date).AddDays(1).ToString('yyyy-MM-dd')
        date_fin = (Get-Date).AddDays(8).ToString('yyyy-MM-dd')
        capacite_max = 50
    } | ConvertTo-Json
    
    $campaignResponse = Invoke-WebRequest -Uri "$API_URL/api/collaborator/campaigns" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{
            Authorization = "Bearer $token"
        } `
        -Body $campaignBody | ConvertFrom-Json
    
    $campaignId = $campaignResponse.id
    Write-Host "Success - Campaign ID: $campaignId" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 3: List Campaigns" -ForegroundColor Cyan

try {
    $listResponse = Invoke-WebRequest -Uri "$API_URL/api/collaborator/campaigns" `
        -Method GET `
        -Headers @{
            Authorization = "Bearer $token"
        } | ConvertFrom-Json
    
    $count = $listResponse.campaigns.Count
    Write-Host "Success - Found $count campaign(s)" -ForegroundColor Green
    Write-Host $listResponse.campaigns | ConvertTo-Json
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nAll tests passed!" -ForegroundColor Green
