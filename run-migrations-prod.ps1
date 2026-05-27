#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Exécute toutes les migrations sur la base de données de production
.DESCRIPTION
  Script pour exécuter les migrations SQL sur PostgreSQL Render
#>

param(
    [string]$DatabaseUrl = "postgresql://signal_moi_db_bqhw_user:YOwlsgv09ScniveqtI0ostBM7mHZmaKb@dpg-d80gj4vaqgkc73a3tq2g-a.frankfurt-postgres.render.com/signal_moi_db_bqhw"
)

Write-Host "🔧 Exécution des migrations Signal-Moi..." -ForegroundColor Cyan

# Définir la variable d'environnement
$env:DATABASE_URL = $DatabaseUrl

Write-Host "📡 Base de données: $($DatabaseUrl.Split('@')[1])" -ForegroundColor Yellow

# Exécuter le script de migration
try {
    Write-Host "`n▶️  Lancement des migrations..." -ForegroundColor Green
    node scripts/run_migrations_sql.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Migrations exécutées avec succès!" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Erreur lors des migrations" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    exit 1
}
