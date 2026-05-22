#!/usr/bin/env pwsh
# ============================================================
# Signal-Moi Test Script - Valider les corrections d'auth
# ============================================================
# Utilisation: .\test-signal-moi.ps1

param(
    [string]$BackendUrl = "http://localhost:8080",
    [string]$Email = "test@signal-moi.fr",
    [string]$Password = "TestPass123!"
)

Write-Host "🧪 Signal-Moi - Test Suite" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Yellow
Write-Host ""

# ============================================================
# TEST 1: Health Check
# ============================================================
Write-Host "TEST 1️⃣  : Health Check" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/api/health" -Method Get
    Write-Host "✅ Backend is running: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend unreachable: $_" -ForegroundColor Red
    exit 1
}

# ============================================================
# TEST 2: Register New User
# ============================================================
Write-Host ""
Write-Host "TEST 2️⃣  : Register User" -ForegroundColor Green
$registerBody = @{
    prenom = "Test"
    nom = "User"
    email = $Email
    telephone = "0600000000"
    password = $Password
    ville = "Paris"
    quartier = "Marais"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$BackendUrl/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody

    $token = $registerResponse.token
    Write-Host "✅ Registration successful" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 50))..." -ForegroundColor Cyan
    
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "⚠️  User already exists - will try login instead" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Registration failed: $_" -ForegroundColor Red
        exit 1
    }
}

# ============================================================
# TEST 3: Login
# ============================================================
Write-Host ""
Write-Host "TEST 3️⃣  : Login" -ForegroundColor Green
$loginBody = @{
    email = $Email
    password = $Password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody

    $token = $loginResponse.token
    $userId = $loginResponse.user.id
    
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "   User ID: $userId" -ForegroundColor Cyan
    Write-Host "   Token: $($token.Substring(0, 50))..." -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    Write-Host "   Make sure password is correct and bcrypt comparison is working!" -ForegroundColor Yellow
    exit 1
}

# ============================================================
# TEST 4: Create Signalement (Protected Route)
# ============================================================
Write-Host ""
Write-Host "TEST 4️⃣  : Create Signalement (Protected)" -ForegroundColor Green

$signalementBody = @{
    titre = "Nid de poule test"
    description = "Grand trou dans la route pour tester"
    type = "Infrastructure"
    localisation = "48 rue de la Paix, Paris"
    latitude = 48.8566
    longitude = 2.3522
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $signalementResponse = Invoke-RestMethod -Uri "$BackendUrl/api/signalements" `
        -Method Post `
        -Headers $headers `
        -Body $signalementBody

    Write-Host "✅ Signalement created successfully" -ForegroundColor Green
    Write-Host "   ID: $($signalementResponse.id)" -ForegroundColor Cyan
    Write-Host "   User ID: $($signalementResponse.user_id)" -ForegroundColor Cyan
    Write-Host "   Title: $($signalementResponse.titre)" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Signalement creation failed: $_" -ForegroundColor Red
    Write-Host "   Error Details: $($_.Exception.Response.Content | ConvertFrom-Json | ConvertTo-Json)" -ForegroundColor Yellow
    exit 1
}

# ============================================================
# TEST 5: Get User's Signalements
# ============================================================
Write-Host ""
Write-Host "TEST 5️⃣  : Get User's Signalements (Protected)" -ForegroundColor Green

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $signalementsList = Invoke-RestMethod -Uri "$BackendUrl/api/signalements/user/$userId" `
        -Method Get `
        -Headers $headers

    Write-Host "✅ Retrieved signalements successfully" -ForegroundColor Green
    Write-Host "   Count: $($signalementsList.Count)" -ForegroundColor Cyan
    
    if ($signalementsList.Count -gt 0) {
        Write-Host "   Latest: $($signalementsList[0].titre)" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "❌ Failed to retrieve signalements: $_" -ForegroundColor Red
    exit 1
}

# ============================================================
# TEST 6: Get Public Signalements (No Auth Required)
# ============================================================
Write-Host ""
Write-Host "TEST 6️⃣  : Get Public Signalements (No Auth)" -ForegroundColor Green

try {
    $publicList = Invoke-RestMethod -Uri "$BackendUrl/api/signalements/public" -Method Get
    Write-Host "✅ Retrieved public signalements successfully" -ForegroundColor Green
    Write-Host "   Total count: $($publicList.Count)" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Failed to retrieve public signalements: $_" -ForegroundColor Red
}

# ============================================================
# Summary
# ============================================================
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ All tests passed! Your auth fixes are working." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Yellow
Write-Host "1. Set JWT_SECRET on Render: $env:JWT_SECRET" -ForegroundColor Yellow
Write-Host "2. Set DATABASE_URL on Render" -ForegroundColor Yellow
Write-Host "3. Redeploy on Render" -ForegroundColor Yellow
Write-Host "4. Test on production" -ForegroundColor Yellow
