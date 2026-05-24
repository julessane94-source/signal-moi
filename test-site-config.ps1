#!/usr/bin/env pwsh
# Test mise à jour site-config depuis compte admin

$API_URL = "https://signal-moi-api.onrender.com"
$ADMIN_EMAIL = "admin@signal-moi.fr"
$ADMIN_PASSWORD = "Admin123!"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Mise à Jour Site Config" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Étape 1: Login
Write-Host "[1/4] Connexion admin..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $ADMIN_EMAIL
        password = $ADMIN_PASSWORD
    } | ConvertTo-Json
    
    $loginResponse = Invoke-WebRequest -Uri "$API_URL/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 10
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    Write-Host "  ✅ Connecté en tant que: $($loginData.user.email) (role: $($loginData.user.role))" -ForegroundColor Green
}
catch {
    Write-Host "  ❌ Erreur login: $_" -ForegroundColor Red
    exit 1
}

# Étape 2: Lire config actuelle
Write-Host "`n[2/4] Lecture config actuelle..." -ForegroundColor Yellow
try {
    $configResponse = Invoke-WebRequest -Uri "$API_URL/api/admin/site-config" `
        -Headers @{"Authorization" = "Bearer $token"} `
        -UseBasicParsing `
        -TimeoutSec 10
    
    $currentConfig = $configResponse.Content | ConvertFrom-Json
    Write-Host "  ✅ Config actuelle:" -ForegroundColor Green
    $currentConfig | ConvertTo-Json | Write-Host
}
catch {
    Write-Host "  ❌ Erreur lecture config: $_" -ForegroundColor Red
    exit 1
}

# Étape 3: Mettre à jour la config
Write-Host "`n[3/4] Mise à jour de la config..." -ForegroundColor Yellow
try {
    $newConfig = @{
        siteName = "Signal-Moi - Plateforme Citoyenne (MISE À JOUR)"
        contactEmail = "contact@signal-moi.fr"
        contactPhone = "+33 1 23 45 67 89"
        address = "123 Rue de la Paix, 75000 Paris - FRANCE"
        contactPage = @{
            title = "Nous Contacter"
            description = "PAGE DE CONTACT MISE À JOUR - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
            email = "support@signal-moi.fr"
        }
        aboutPage = @{
            title = "À Propos"
            description = "PAGE À PROPOS MISE À JOUR - Signal-Moi est une plateforme citoyenne moderne"
            mission = "Permettre aux citoyens de signaler des problèmes dans leur communauté"
        }
    } | ConvertTo-Json
    
    Write-Host "  Envoi: $newConfig" -ForegroundColor Cyan
    
    $updateResponse = Invoke-WebRequest -Uri "$API_URL/api/admin/site-config" `
        -Method POST `
        -Headers @{"Authorization" = "Bearer $token"} `
        -Body $newConfig `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 10
    
    Write-Host "  ✅ Config mise à jour avec succès!" -ForegroundColor Green
    $updateResponse.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host
}
catch {
    Write-Host "  ❌ Erreur mise à jour: $_" -ForegroundColor Red
    exit 1
}

# Étape 4: Vérifier la mise à jour
Write-Host "`n[4/4] Vérification de la mise à jour..." -ForegroundColor Yellow
try {
    Start-Sleep -Seconds 2
    
    $verifyResponse = Invoke-WebRequest -Uri "$API_URL/api/admin/site-config" `
        -Headers @{"Authorization" = "Bearer $token"} `
        -UseBasicParsing `
        -TimeoutSec 10
    
    $updatedConfig = $verifyResponse.Content | ConvertFrom-Json
    Write-Host "  ✅ Config vérifiée:" -ForegroundColor Green
    $updatedConfig | ConvertTo-Json | Write-Host
    
    # Vérifier que le changement a bien eu lieu
    if ($updatedConfig.siteName -like "*MISE À JOUR*") {
        Write-Host "`n✅ SUCCÈS: Le nom du site a été changé!" -ForegroundColor Green
    }
}
catch {
    Write-Host "  ❌ Erreur vérification: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Terminé" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
