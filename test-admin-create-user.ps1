#!/usr/bin/env powershell

$baseUrl = "https://signal-moi-api.onrender.com"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test création utilisateur via admin" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Login admin
Write-Host "`n[1/2] Connexion admin..." -ForegroundColor Yellow
$adminBody = @{
    email = "admin@signal-moi.fr"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -Body $adminBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    if ($loginData.success) {
        $adminToken = $loginData.token
        Write-Host "✅ Token admin obtenu" -ForegroundColor Green
    } else {
        Write-Host "❌ Échec login: $($loginData.message)" -ForegroundColor Red
        exit
    }
} catch {
    Write-Host "❌ Erreur connexion: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Step 2: Create new user via admin endpoint
Write-Host "`n[2/2] Création nouvel utilisateur..." -ForegroundColor Yellow

$newUserBody = @{
    prenom = "Jean"
    nom = "Dupont"
    email = "jean.dupont@example.com"
    telephone = "771234567"
    password = "SecurePass123!"
    ville = "Dakar"
    quartier = "Marche"
    role = "citoyen"
} | ConvertTo-Json

Write-Host "Corps de la requête:" -ForegroundColor Gray
Write-Host $newUserBody -ForegroundColor Gray

try {
    $createResponse = Invoke-WebRequest -Uri "$baseUrl/api/admin/users" `
        -Method POST `
        -Body $newUserBody `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $adminToken" } `
        -UseBasicParsing
    
    $userData = $createResponse.Content | ConvertFrom-Json
    Write-Host "✅ Utilisateur créé avec succès!" -ForegroundColor Green
    Write-Host "   ID: $($userData.id)" -ForegroundColor Gray
    Write-Host "   Email: $($userData.email)" -ForegroundColor Gray
    Write-Host "   Rôle: $($userData.role)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur création: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    try {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $streamReader = [System.IO.StreamReader]::new($errorResponse)
        $errorContent = $streamReader.ReadToEnd()
        Write-Host "   Détails: $errorContent" -ForegroundColor Yellow
    } catch {
        Write-Host "   Message: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
