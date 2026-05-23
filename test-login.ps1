#!/usr/bin/env pwsh

$baseUrl = "https://signal-moi-api.onrender.com"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test d'authentification Signal-Moi" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test 1: Admin login
Write-Host "`n[1/4] Test connexion ADMIN..." -ForegroundColor Yellow
$adminBody = @{
    email = "admin@signal-moi.fr"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $adminResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -Body $adminBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    $adminData = $adminResponse.Content | ConvertFrom-Json
    if ($adminData.success) {
        Write-Host "✅ Connexion admin réussie" -ForegroundColor Green
        Write-Host "   Token: $($adminData.token.Substring(0,20))..." -ForegroundColor Gray
        $adminToken = $adminData.token
    } else {
        Write-Host "❌ Échec login admin: $($adminData.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur admin: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Citoyen login
Write-Host "`n[2/4] Test connexion CITOYEN..." -ForegroundColor Yellow
$citizenBody = @{
    email = "julessane94@gmail.com"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $citizenResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -Body $citizenBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    $citizenData = $citizenResponse.Content | ConvertFrom-Json
    if ($citizenData.success) {
        Write-Host "✅ Connexion citoyen réussie" -ForegroundColor Green
        Write-Host "   Token: $($citizenData.token.Substring(0,20))..." -ForegroundColor Gray
        $citizenToken = $citizenData.token
    } else {
        Write-Host "❌ Échec login citoyen: $($citizenData.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur citoyen: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Admin profile
if ($adminToken) {
    Write-Host "`n[3/4] Test profil ADMIN..." -ForegroundColor Yellow
    try {
        $adminProfileResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/me" `
            -Headers @{ "Authorization" = "Bearer $adminToken" } `
            -UseBasicParsing
        
        $profileData = $adminProfileResponse.Content | ConvertFrom-Json
        Write-Host "✅ Profil admin récupéré" -ForegroundColor Green
        Write-Host "   Prénom: $($profileData.user.prenom)" -ForegroundColor Gray
        Write-Host "   Nom: $($profileData.user.nom)" -ForegroundColor Gray
        Write-Host "   Rôle: $($profileData.user.role)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Erreur profil admin: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: Citoyen dashboard
if ($citizenToken) {
    Write-Host "`n[4/4] Test dashboard CITOYEN..." -ForegroundColor Yellow
    try {
        $dashboardResponse = Invoke-WebRequest -Uri "$baseUrl/api/citizen/dashboard" `
            -Headers @{ "Authorization" = "Bearer $citizenToken" } `
            -UseBasicParsing
        
        $dashboardData = $dashboardResponse.Content | ConvertFrom-Json
        Write-Host "✅ Dashboard citoyen récupéré" -ForegroundColor Green
        Write-Host "   Prenom: $($dashboardData.dashboard.user.prenom)" -ForegroundColor Gray
        Write-Host "   Nom: $($dashboardData.dashboard.user.nom)" -ForegroundColor Gray
        Write-Host "   Stats - Signalements: $($dashboardData.dashboard.stats.totalSignalements)" -ForegroundColor Gray
        Write-Host "   Stats - Inscriptions: $($dashboardData.dashboard.stats.totalInscriptions)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Erreur dashboard: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Tests d'authentification terminés" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
