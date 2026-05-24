#!/usr/bin/env powershell

$baseUrl = "https://signal-moi-api.onrender.com"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Résumé: Création et test d'utilisateur" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Admin login
Write-Host "`n[1/4] Connexion admin..." -ForegroundColor Yellow
$adminBody = @{
    email = "admin@signal-moi.fr"
    password = "Admin123!"
} | ConvertTo-Json

$adminResp = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $adminBody -ContentType "application/json" -UseBasicParsing
$adminData = $adminResp.Content | ConvertFrom-Json
$adminToken = $adminData.token
Write-Host "✅ Admin connecté" -ForegroundColor Green

# 2. Récupérer la liste des utilisateurs
Write-Host "`n[2/4] Récupération liste des utilisateurs..." -ForegroundColor Yellow
$usersResp = Invoke-WebRequest -Uri "$baseUrl/api/admin/users" `
    -Headers @{ "Authorization" = "Bearer $adminToken" } `
    -UseBasicParsing
$users = $usersResp.Content | ConvertFrom-Json
Write-Host "✅ Liste reçue ($($users.Count) utilisateurs)" -ForegroundColor Green
Write-Host "   Utilisateurs:" -ForegroundColor Gray
$users | ForEach-Object {
    Write-Host "   - $($_.prenom) $($_.nom) ($($_.email)) - Rôle: $($_.role)" -ForegroundColor Gray
}

# 3. Créer un nouvel utilisateur
Write-Host "`n[3/4] Création nouvel utilisateur..." -ForegroundColor Yellow
$newUserBody = @{
    prenom = "Marie"
    nom = "Martin"
    email = "marie.martin@example.com"
    telephone = "771111111"
    password = "Password123!"
    ville = "Thiès"
    quartier = "Cité"
    role = "citoyen"
} | ConvertTo-Json

$createResp = Invoke-WebRequest -Uri "$baseUrl/api/admin/users" -Method POST -Body $newUserBody -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $adminToken" } -UseBasicParsing
$newUser = $createResp.Content | ConvertFrom-Json
Write-Host "✅ Utilisateur créé: $($newUser.prenom) $($newUser.nom)" -ForegroundColor Green
Write-Host "   Email: $($newUser.email)" -ForegroundColor Gray
Write-Host "   ID: $($newUser.id)" -ForegroundColor Gray

# 4. Récupérer la liste mise à jour
Write-Host "`n[4/4] Liste utilisateurs mise à jour..." -ForegroundColor Yellow
$usersResp2 = Invoke-WebRequest -Uri "$baseUrl/api/admin/users" `
    -Headers @{ "Authorization" = "Bearer $adminToken" } `
    -UseBasicParsing
$users2 = $usersResp2.Content | ConvertFrom-Json
Write-Host "✅ Total: $($users2.Count) utilisateurs" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Tests complétés avec succès!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
