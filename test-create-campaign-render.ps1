#!/usr/bin/env pwsh
# Test complet de création de campagne sur Render

$ApiUrl = "https://signal-moi-api.onrender.com"
$Email = "collab@test.com"
$Password = "Collab@1234!"

Write-Host "🚀 Test de création de campagne sur Render" -ForegroundColor Cyan
Write-Host "======================================`n"

# 1️⃣ LOGIN
Write-Host "1️⃣ Connexion..." -ForegroundColor Yellow
$loginBody = @{
    email = $Email
    password = $Password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$ApiUrl/api/auth/login" `
        -Method Post `
        -ContentType 'application/json' `
        -Body $loginBody `
        -ErrorAction Stop | Select-Object -ExpandProperty Content | ConvertFrom-Json
    
    $token = $loginResponse.token
    Write-Host "✅ Token obtenu: $($token.Substring(0,20))...`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur login: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception.Response.Content | ConvertFrom-Json | ConvertTo-Json
    exit 1
}

# 2️⃣ CREATE CAMPAIGN
Write-Host "2️⃣ Création de campagne..." -ForegroundColor Yellow

$campaignData = @{
    titre = "Campagne Test Vercel $(Get-Date -Format 'HHmmss')"
    description = "Test de création de campagne via Render API"
    type = "atelier"
    dateDebut = (Get-Date).ToString("yyyy-MM-dd")
    dateFin = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
    lieu = "Paris"
    capaciteMax = 50
} | ConvertTo-Json

try {
    $campaignResponse = Invoke-WebRequest -Uri "$ApiUrl/api/collaborator/campaigns" `
        -Method Post `
        -ContentType 'application/json' `
        -Headers @{ "Authorization" = "Bearer $token" } `
        -Body $campaignData `
        -ErrorAction Stop | Select-Object -ExpandProperty Content | ConvertFrom-Json
    
    Write-Host "✅ Campagne créée avec succès!" -ForegroundColor Green
    Write-Host "   ID: $($campaignResponse.id)"
    Write-Host "   Titre: $($campaignResponse.titre)"
    Write-Host "   Type: $($campaignResponse.type)`n"
} catch {
    Write-Host "❌ Erreur création campagne: $($_.Exception.Message)" -ForegroundColor Red
    try {
        $errorContent = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()).ReadToEnd()
        Write-Host $errorContent
    } catch { }
    exit 1
}

# 3️⃣ LIST CAMPAIGNS
Write-Host "3️⃣ Récupération des campagnes..." -ForegroundColor Yellow
try {
    $listResponse = Invoke-WebRequest -Uri "$ApiUrl/api/collaborator/campaigns" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $token" } `
        -ErrorAction Stop | Select-Object -ExpandProperty Content | ConvertFrom-Json
    
    Write-Host "✅ $($listResponse.Count) campagne(s) trouvée(s)" -ForegroundColor Green
    $listResponse | ForEach-Object {
        Write-Host "   - $($_.titre) (créée: $($_.createdAt))"
    }
} catch {
    Write-Host "⚠️ Erreur lors de la récupération: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n✅ TEST COMPLÉTÉ AVEC SUCCÈS!" -ForegroundColor Green
