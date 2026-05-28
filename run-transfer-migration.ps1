#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Execute migrations for the assigned_to transfer feature
#>

$env:DATABASE_URL = "postgresql://signal_moi_db_bqhw_user:YOwlsgv09ScniveqtI0ostBM7mHZmaKb@dpg-d80gj4vaqgkc73a3tq2g-a.frankfurt-postgres.render.com/signal_moi_db_bqhw"
$env:DATABASE_SSL = "true"
$env:NODE_ENV = "production"

Write-Host "🔧 Executing migration for transfer feature..." -ForegroundColor Cyan
Write-Host "📡 Database: dpg-d80gj4vaqgkc73a3tq2g-a.frankfurt-postgres.render.com" -ForegroundColor Yellow

node scripts/run_migrations_sql.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Migration successful!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Migration failed!" -ForegroundColor Red
    exit 1
}
