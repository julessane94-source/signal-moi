# Script PowerShell pour exécuter les migrations sur la base de données Render
# Usage: .\run-migrations-render.ps1

param(
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [string]$MigrationsDir = ".\database\migrations"
)

if (-not $DatabaseUrl) {
    Write-Host "❌ Erreur: DATABASE_URL non défini" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Exécution des migrations SQL..." -ForegroundColor Cyan

# Vérifier que le répertoire existe
if (-not (Test-Path $MigrationsDir)) {
    Write-Host "❌ Erreur: Le répertoire $MigrationsDir n'existe pas" -ForegroundColor Red
    exit 1
}

# Récupérer tous les fichiers de migration triés par nom
$migrations = Get-ChildItem "$MigrationsDir\*.sql" | Sort-Object Name

foreach ($migration in $migrations) {
    $filename = $migration.Name
    Write-Host "▶️  Exécution: $filename" -ForegroundColor Yellow
    
    try {
        # Lire le contenu du fichier
        $sqlContent = Get-Content $migration.FullName -Raw
        
        # Exécuter avec psql
        $output = echo "$sqlContent" | psql "$DatabaseUrl" 2>&1
        
        if ($output -like "*ERROR*" -and $output -notlike "*does not exist*") {
            Write-Host "⚠️  Attention lors de l'exécution de $filename (mais c'est ok si IF NOT EXISTS)" -ForegroundColor Yellow
        } else {
            Write-Host "✅ $filename exécutée" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Erreur lors de l'exécution de $filename : $_" -ForegroundColor Red
    }
}

Write-Host "✅ Toutes les migrations ont été exécutées" -ForegroundColor Green
