#!/usr/bin/env powershell

$baseUrl = "https://signal-moi-api.onrender.com"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Vérification: Vue globale Admin" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Admin login
Write-Host "`n[1/4] Connexion admin..." -ForegroundColor Yellow
$adminBody = @{
    email = "admin@signal-moi.fr"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $adminResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $adminBody -ContentType "application/json" -UseBasicParsing
    $adminData = $adminResp.Content | ConvertFrom-Json
    $adminToken = $adminData.token
    Write-Host "✅ Admin connecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur connexion: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Récupérer les utilisateurs
Write-Host "`n[2/4] Récupération des utilisateurs..." -ForegroundColor Yellow
try {
    $usersResp = Invoke-WebRequest -Uri "$baseUrl/api/admin/users" `
        -Headers @{ "Authorization" = "Bearer $adminToken" } `
        -UseBasicParsing
    $users = $usersResp.Content | ConvertFrom-Json
    $userCount = @($users).Count
    Write-Host "✅ $userCount utilisateurs récupérés" -ForegroundColor Green
    Write-Host "   Détails:" -ForegroundColor Gray
    $users | ForEach-Object {
        Write-Host "   • $($_.prenom) $($_.nom) - $($_.email) (Role: $($_.role))" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Erreur utilisateurs: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Récupérer les signalements
Write-Host "`n[3/4] Récupération des signalements..." -ForegroundColor Yellow
try {
    $signalementsResp = Invoke-WebRequest -Uri "$baseUrl/api/admin/signalements" `
        -Headers @{ "Authorization" = "Bearer $adminToken" } `
        -UseBasicParsing
    $signalements = $signalementsResp.Content | ConvertFrom-Json
    $sigCount = @($signalements).Count
    Write-Host "✅ $sigCount signalements récupérés" -ForegroundColor Green
    if ($sigCount -gt 0) {
        Write-Host "   Détails:" -ForegroundColor Gray
        $signalements | ForEach-Object {
            Write-Host "   • $($_.titre) - Type: $($_.type) - Statut: $($_.statut)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   (Aucun signalement)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Erreur signalements: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Récupérer les campagnes
Write-Host "`n[4/4] Récupération des campagnes..." -ForegroundColor Yellow
try {
    $campaignesResp = Invoke-WebRequest -Uri "$baseUrl/api/admin/campagnes" `
        -Headers @{ "Authorization" = "Bearer $adminToken" } `
        -UseBasicParsing -TimeoutSec 10 -SkipHttpErrorCheck
    
    if ($campaignesResp.StatusCode -eq 200) {
        $campagnes = $campaignesResp.Content | ConvertFrom-Json
        $campCount = @($campagnes).Count
        Write-Host "✅ $campCount campagnes récupérées" -ForegroundColor Green
        if ($campCount -gt 0) {
            Write-Host "   Détails:" -ForegroundColor Gray
            $campagnes | ForEach-Object {
                Write-Host "   • $($_.titre) - Type: $($_.type) - Actif: $($_.est_actif)" -ForegroundColor Gray
            }
        } else {
            Write-Host "   (Aucune campagne)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Erreur HTTP $($campaignesResp.StatusCode): $($campaignesResp.Content)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur campagnes: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Vérification terminée!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
