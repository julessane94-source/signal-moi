#!/usr/bin/env powershell

$baseUrl = "https://signal-moi-api.onrender.com"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Création d'un compte collaborateur" -ForegroundColor Cyan
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
    if ($loginData.token) {
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

# Step 2: Create new collaborateur user
Write-Host "`n[2/2] Création d'un utilisateur collaborateur..." -ForegroundColor Yellow

$newUserBody = @{
    prenom = "Marc"
    nom = "Collaborator"
    email = "collaborateur@signal-moi.fr"
    telephone = "771234567"
    password = "Collaborateur123!"
    ville = "Yaoundé"
    quartier = "Centereville"
    role = "collaborateur"
} | ConvertTo-Json

Write-Host "Corps de la requête: $newUserBody" -ForegroundColor Gray

try {
    $createResponse = Invoke-WebRequest -Uri "$baseUrl/api/admin/users" `
        -Method POST `
        -Body $newUserBody `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $adminToken" } `
        -UseBasicParsing
    
    $userData = $createResponse.Content | ConvertFrom-Json
    Write-Host "`n✅ Utilisateur collaborateur créé avec succès!" -ForegroundColor Green
    Write-Host "Email: collaborateur@signal-moi.fr" -ForegroundColor Cyan
    Write-Host "Password: Collaborateur123!" -ForegroundColor Cyan
    Write-Host "ID: $($userData.id)" -ForegroundColor Cyan
} catch {
    Write-Host "`n❌ Erreur création: $($_.Exception.Message)" -ForegroundColor Red
    $errorBody = $_.Exception.Response.Content.ReadAsStream() | % { [System.IO.StreamReader]::new($_).ReadToEnd() }
    Write-Host "Details: $errorBody" -ForegroundColor Red
}
