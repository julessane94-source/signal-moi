Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CORRECTION DES ACCENTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$remplacements = @(
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "???"; Nouveau = "'" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" },
    @{ Original = "??"; Nouveau = "?" }
)

$fichiersCorriges = 0

$dossiers = @("frontend\src\pages", "frontend\src\components", "frontend\src\context", "frontend\src\layouts")

foreach ($dossier in $dossiers) {
    $chemin = Join-Path $PSScriptRoot $dossier
    if (Test-Path $chemin) {
        $fichiers = Get-ChildItem -Path $chemin -Recurse -Include "*.js", "*.jsx", "*.tsx", "*.css"
        
        foreach ($fichier in $fichiers) {
            $contenu = Get-Content $fichier.FullName -Raw -ErrorAction SilentlyContinue
            if ($contenu) {
                $modifie = $false
                foreach ($remplacement in $remplacements) {
                    if ($contenu -match $remplacement.Original) {
                        $contenu = $contenu -replace $remplacement.Original, $remplacement.Nouveau
                        $modifie = $true
                    }
                }
                if ($modifie) {
                    $Utf8NoBom = New-Object System.Text.UTF8Encoding $false
                    [System.IO.File]::WriteAllText($fichier.FullName, $contenu, $Utf8NoBom)
                    $fichiersCorriges++
                    Write-Host "? Corrige: $($fichier.Name)" -ForegroundColor Green
                }
            }
        }
    }
}

Write-Host "`n?? Fichiers avec accents corriges: $fichiersCorriges" -ForegroundColor Green
Write-Host "? Termine !" -ForegroundColor Cyan