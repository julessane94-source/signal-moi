# Script de test pour créer campagne et signalement
# Assurez-vous que le backend est en cours d'exécution sur le port 3001

Write-Host "=== Test de Création de Campagne et Signalement ===" -ForegroundColor Green

# 1. Obtenir un token (ou utiliser un existant)
Write-Host "`n1. Login pour obtenir un token..." -ForegroundColor Yellow

$loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"password123"}' `
  -SkipCertificateCheck -ErrorAction SilentlyContinue

if ($loginResponse.StatusCode -eq 200) {
  $loginData = $loginResponse.Content | ConvertFrom-Json
  $token = $loginData.token
  Write-Host "✅ Token obtenu: $($token.substring(0, 20))..." -ForegroundColor Green
} else {
  Write-Host "❌ Erreur login" -ForegroundColor Red
  exit 1
}

# 2. Tester la création de campagne
Write-Host "`n2. Test: Créer une campagne..." -ForegroundColor Yellow

$campagneBody = @{
  titre = "Campagne Test $(Get-Date -Format 'HHmmss')"
  description = "Description de test"
  type = "pétition"
  date_debut = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")
  date_fin = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
  lieu = "Paris"
  capacite_max = 500
} | ConvertTo-Json

try {
  $campagneResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/campagnes" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body $campagneBody `
    -SkipCertificateCheck
  
  $campagne = $campagneResponse.Content | ConvertFrom-Json
  Write-Host "✅ Campagne créée: $($campagne.id)" -ForegroundColor Green
  $campaigneId = $campagne.id
} catch {
  Write-Host "❌ Erreur création campagne:" -ForegroundColor Red
  Write-Host $_.Exception.Response.StatusCode
  Write-Host $_.Exception.Message
  exit 1
}

# 3. Tester la création de signalement
Write-Host "`n3. Test: Créer un signalement..." -ForegroundColor Yellow

$signalementBody = @{
  titre = "Signalement Test $(Get-Date -Format 'HHmmss')"
  description = "Description du signalement"
  type = "violence"
  localisation = "10 Rue de la Paix, Paris"
  latitude = "48.8566"
  longitude = "2.3522"
} | ConvertTo-Json

try {
  $signalementResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/signalements" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body $signalementBody `
    -SkipCertificateCheck
  
  $signalement = $signalementResponse.Content | ConvertFrom-Json
  Write-Host "✅ Signalement créé: $($signalement.id)" -ForegroundColor Green
} catch {
  Write-Host "❌ Erreur création signalement:" -ForegroundColor Red
  Write-Host $_.Exception.Response.StatusCode
  Write-Host $_.Exception.Message
  exit 1
}

# 4. Résumé
Write-Host "`n=== ✅ Tous les tests réussis! ===" -ForegroundColor Green
Write-Host "Campagne: $campaigneId"
Write-Host "Signalement: $($signalement.id)"
