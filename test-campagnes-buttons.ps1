# Script PowerShell de test pour les boutons Campagnes et Plaidoyers

$API_URL = "http://localhost:3001/api"
$FRONTEND_URL = "http://localhost:3000"

Write-Host "🧪 TEST DES BOUTONS - CAMPAGNES ET PLAIDOYERS" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Récupérer toutes les campagnes
Write-Host "1️⃣  Récupération des campagnes..." -ForegroundColor Yellow

try {
    $campagnes = Invoke-RestMethod "$API_URL/campagnes" -Method Get -ErrorAction Stop
    $campagne_id = $campagnes[0].id
    
    if (-not $campagne_id) {
        Write-Host "❌ Aucune campagne trouvée" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Campagne trouvée: $campagne_id" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur récupération campagnes: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Récupérer les plaidoyers
Write-Host "2️⃣  Récupération des plaidoyers..." -ForegroundColor Yellow

try {
    $plaidoyers = Invoke-RestMethod "$API_URL/plaidoyers" -Method Get -ErrorAction Stop
    $plaidoyer_id = $plaidoyers[0].id
    
    if ($plaidoyer_id) {
        Write-Host "✅ Plaidoyer trouvé: $plaidoyer_id" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Aucun plaidoyer trouvé" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Erreur récupération plaidoyers: $_" -ForegroundColor Yellow
}
Write-Host ""

# 3. Connexion utilisateur de test
Write-Host "3️⃣  Connexion utilisateur de test..." -ForegroundColor Yellow

$loginBody = @{
    email = "test@signal-moi.fr"
    password = "Password123!"
} | ConvertTo-Json

try {
    $login = Invoke-RestMethod "$API_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    $token = $login.token
    
    if (-not $token) {
        Write-Host "❌ Erreur de connexion" -ForegroundColor Red
        Write-Host "Réponse: $($login | ConvertTo-Json)" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Connecté avec token: $($token.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur connexion: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 4. Vérifier l'inscription avant
Write-Host "4️⃣  Vérification de l'inscription (avant)..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $inscr_check = Invoke-RestMethod "$API_URL/campagnes/$campagne_id/inscrit" -Method Get -Headers $headers -ErrorAction Stop
    $is_inscribed = $inscr_check.isInscribed
    Write-Host "   État inscription: $is_inscribed" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erreur vérification: $_" -ForegroundColor Red
}
Write-Host ""

# 5. S'inscrire à la campagne
Write-Host "5️⃣  S'inscrire à la campagne..." -ForegroundColor Yellow

try {
    $inscription = Invoke-RestMethod "$API_URL/campagnes/$campagne_id/inscrire" `
        -Method Post `
        -Headers $headers `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    if ($inscription.success) {
        Write-Host "✅ Inscription réussie!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur: $($inscription.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur inscription: $_" -ForegroundColor Red
}
Write-Host ""

# 6. Vérifier l'inscription après
Write-Host "6️⃣  Vérification de l'inscription (après)..." -ForegroundColor Yellow

try {
    $inscr_check2 = Invoke-RestMethod "$API_URL/campagnes/$campagne_id/inscrit" -Method Get -Headers $headers -ErrorAction Stop
    $is_inscribed2 = $inscr_check2.isInscribed
    Write-Host "   État inscription: $is_inscribed2" -ForegroundColor Cyan
    
    if ($is_inscribed2) {
        Write-Host "✅ Inscription confirmée!" -ForegroundColor Green
    } else {
        Write-Host "❌ Inscription non confirmée" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur vérification: $_" -ForegroundColor Red
}
Write-Host ""

# 7. Signature du plaidoyer
if ($plaidoyer_id) {
    Write-Host "7️⃣  Signature du plaidoyer..." -ForegroundColor Yellow
    
    try {
        $signature = Invoke-RestMethod "$API_URL/plaidoyers/$plaidoyer_id/sign" `
            -Method Post `
            -Headers $headers `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        if ($signature.success) {
            Write-Host "✅ Plaidoyer signé!" -ForegroundColor Green
        } else {
            Write-Host "❌ Erreur: $($signature.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Erreur signature: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Plaidoyer non disponible - test signature ignoré" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "✅ Tests terminés!" -ForegroundColor Green
Write-Host ""
Write-Host "Pour tester les boutons en frontend:" -ForegroundColor Cyan
Write-Host "1. Accédez à: $FRONTEND_URL/campagnes/$campagne_id" -ForegroundColor Cyan
Write-Host "2. Connectez-vous avec test@signal-moi.fr / Password123!" -ForegroundColor Cyan
Write-Host "3. Cliquez sur 'S'inscrire'" -ForegroundColor Cyan
Write-Host ""
