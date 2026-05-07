Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CORRECTION DES FICHIERS SIGNAL-MOI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$dossiers = @(
    "frontend\src\pages",
    "frontend\src\components",
    "frontend\src\context",
    "frontend\src\layouts",
    "frontend\src\utils",
    "frontend\src\services"
)

$fichiersCorriges = 0
$erreurs = 0

foreach ($dossier in $dossiers) {
    $cheminComplet = Join-Path $PSScriptRoot $dossier
    if (Test-Path $cheminComplet) {
        Write-Host "`n?? Traitement du dossier: $dossier" -ForegroundColor Yellow
        
        $fichiers = Get-ChildItem -Path $cheminComplet -Recurse -Filter "*.js" -ErrorAction SilentlyContinue
        $fichiers += Get-ChildItem -Path $cheminComplet -Recurse -Filter "*.jsx" -ErrorAction SilentlyContinue
        $fichiers += Get-ChildItem -Path $cheminComplet -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue
        $fichiers += Get-ChildItem -Path $cheminComplet -Recurse -Filter "*.css" -ErrorAction SilentlyContinue
        
        foreach ($fichier in $fichiers) {
            try {
                # Lire le contenu
                $content = Get-Content $fichier.FullName -Raw -ErrorAction Stop
                
                # Sauvegarder en UTF-8 sans BOM
                $Utf8NoBom = New-Object System.Text.UTF8Encoding $false
                [System.IO.File]::WriteAllText($fichier.FullName, $content, $Utf8NoBom)
                
                $fichiersCorriges++
                Write-Host "  ? $($fichier.Name)" -ForegroundColor Green
            }
            catch {
                $erreurs++
                Write-Host "  ? Erreur sur $($fichier.Name): $_" -ForegroundColor Red
            }
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RESULTATS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "?? Fichiers corriges: $fichiersCorriges" -ForegroundColor Green
Write-Host "??  Erreurs: $erreurs" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Nettoyer le cache Next.js
Write-Host "`n?? Nettoyage du cache Next.js..." -ForegroundColor Yellow
if (Test-Path "$PSScriptRoot\frontend\.next") {
    Remove-Item -Path "$PSScriptRoot\frontend\.next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "? Cache Next.js supprime" -ForegroundColor Green
}

Write-Host "`n? Termine ! Redemarrez le frontend avec: npm run dev" -ForegroundColor Green