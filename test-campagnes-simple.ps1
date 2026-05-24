# Script simple pour tester l'endpoint campagnes
param(
    [string]$WaitSeconds = "90"
)

# Attendre le déploiement
Write-Host "Attente de $WaitSeconds secondes pour le redéploiement Render..." -ForegroundColor Yellow
[System.Threading.Thread]::Sleep([int]$WaitSeconds * 1000)

# Test login
Write-Host "`n1️⃣  Test login..." -ForegroundColor Cyan
try {
    $loginRes = Invoke-WebRequest -Uri "https://signal-moi-api.onrender.com/api/auth/login" `
        -Method POST `
        -Body (ConvertTo-Json @{email="admin@signal-moi.fr"; password="Admin123!"}) `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 10
    
    $token = ($loginRes.Content | ConvertFrom-Json).token
    Write-Host "✅ Login réussi. Token: $($token.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "❌ Login échoué: $_" -ForegroundColor Red
    exit 1
}

# Test campagnes
Write-Host "`n2️⃣  Test GET /api/admin/campagnes..." -ForegroundColor Cyan
try {
    $campagnesRes = Invoke-WebRequest -Uri "https://signal-moi-api.onrender.com/api/admin/campagnes" `
        -Headers @{"Authorization"="Bearer $token"} `
        -UseBasicParsing `
        -TimeoutSec 10
    
    Write-Host "✅ Réponse reçue: $($campagnesRes.StatusCode)" -ForegroundColor Green
    Write-Host "   Taille: $($campagnesRes.Content.Length) bytes" -ForegroundColor Green
    
    $campagnes = $campagnesRes.Content | ConvertFrom-Json
    Write-Host "   Campagnes: $($campagnes.Count) trouvées" -ForegroundColor Green
    Write-Host "   Contenu: $($campagnesRes.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Test terminé avec succès!" -ForegroundColor Green
