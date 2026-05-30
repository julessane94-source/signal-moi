# Script de test pour créer une campagne
# Ce script teste le workflow complet : enregistrement, login, puis création de campagne

$ApiUrl = "http://localhost:8080"

# 1. Enregistrer un collaborateur
Write-Host "1️⃣ Enregistrement d'un collaborateur..." -ForegroundColor Cyan

$registerBody = @{
    email = "collab@test.com"
    password = "Test1234!"
    prenom = "Jean"
    nom = "Collaborateur"
    telephone = "+221701234567"
    ville = "Dakar"
    role = "collaborateur"
} | ConvertTo-Json

$registerResponse = Invoke-WebRequest -Uri "$ApiUrl/api/auth/register" `
    -Method POST `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body $registerBody `
    -UseBasicParsing -ErrorAction SilentlyContinue

if ($registerResponse.StatusCode -eq 201 -or $registerResponse.StatusCode -eq 200) {
    Write-Host "✅ Enregistrement réussi" -ForegroundColor Green
    $registerData = $registerResponse.Content | ConvertFrom-Json
    Write-Host "Utilisateur ID: $($registerData.user.id)" -ForegroundColor Gray
} else {
    Write-Host "⚠️ Réponse enregistrement: $($registerResponse.StatusCode)" -ForegroundColor Yellow
    Write-Host $registerResponse.Content -ForegroundColor Gray
}

# 2. Se connecter
Write-Host "`n2️⃣ Connexion..." -ForegroundColor Cyan

$loginBody = @{
    email = "collab@test.com"
    password = "Test1234!"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "$ApiUrl/api/auth/login" `
    -Method POST `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body $loginBody `
    -UseBasicParsing -ErrorAction SilentlyContinue

if ($loginResponse.StatusCode -eq 200) {
    Write-Host "✅ Connexion réussie" -ForegroundColor Green
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    Write-Host "Token obtenu: $($token.Substring(0, 20))..." -ForegroundColor Gray
} else {
    Write-Host "❌ Erreur de connexion: $($loginResponse.StatusCode)" -ForegroundColor Red
    Write-Host $loginResponse.Content -ForegroundColor Gray
    exit
}

# 3. Créer une campagne
Write-Host "`n3️⃣ Création d'une campagne..." -ForegroundColor Cyan

$campagneBody = @{
    titre = "Sensibilisation aux violences de genre"
    description = "Une campagne pour sensibiliser la population aux violences domestiques et comment les signaler"
    type = "atelier"
    dateDebut = "2026-06-01"
    dateFin = "2026-06-30"
    lieu = "Dakar, Sénégal"
} | ConvertTo-Json

$campaignResponse = Invoke-WebRequest -Uri "$ApiUrl/api/collaborator/campaigns" `
    -Method POST `
    -Headers @{ 
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    } `
    -Body $campagneBody `
    -UseBasicParsing -ErrorAction SilentlyContinue

if ($campaignResponse.StatusCode -eq 201 -or $campaignResponse.StatusCode -eq 200) {
    Write-Host "✅ Campagne créée avec succès!" -ForegroundColor Green
    $campaignData = $campaignResponse.Content | ConvertFrom-Json
    Write-Host "ID Campagne: $($campaignData.id)" -ForegroundColor Gray
    Write-Host "Titre: $($campaignData.titre)" -ForegroundColor Gray
    Write-Host "Type: $($campaignData.type)" -ForegroundColor Gray
    Write-Host "Date création: $($campaignData.created_at)" -ForegroundColor Gray
} else {
    Write-Host "❌ Erreur création campagne: $($campaignResponse.StatusCode)" -ForegroundColor Red
    Write-Host $campaignResponse.Content -ForegroundColor Gray
}

Write-Host "`n✨ Test terminé!" -ForegroundColor Cyan
