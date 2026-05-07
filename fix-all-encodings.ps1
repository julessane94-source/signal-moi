Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CORRECTION TOTALE DES ENCODAGES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$fichiers = Get-ChildItem -Path "frontend\src" -Recurse -Include "*.js", "*.jsx", "*.tsx", "*.json", "*.css"

# Table des remplacements pour les caract?res mal encod?s
$corrections = @(
    # ?motic?nes et symboles
    @{ Chercher = "??'?"; Remplacer = "??" },
    @{ Chercher = "??''"; Remplacer = "??" },
    @{ Chercher = "??''"; Remplacer = "??" },
    @{ Chercher = "??'?"; Remplacer = "??" },
    @{ Chercher = "????"; Remplacer = "??" },
    @{ Chercher = "????"; Remplacer = "??" },
    @{ Chercher = "????"; Remplacer = "??" },
    @{ Chercher = "????"; Remplacer = "??" },
    @{ Chercher = "????"; Remplacer = "??" },
    @{ Chercher = "????"; Remplacer = "??" },
    @{ Chercher = "????"; Remplacer = "??" },
    @{ Chercher = "??????"; Remplacer = "??" },
    
    # Lettres accentu?es mal encod?es
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "???"; Remplacer = "'" },
    @{ Chercher = "???"; Remplacer = "'" },
    @{ Chercher = "???"; Remplacer = '"' },
    @{ Chercher = "???"; Remplacer = '"' },
    @{ Chercher = "???"; Remplacer = "?" },
    @{ Chercher = "???"; Remplacer = "-" },
    @{ Chercher = "???"; Remplacer = "-" },
    @{ Chercher = "???"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "???"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "???"; Remplacer = "?" },
    @{ Chercher = "???"; Remplacer = "?" },
    @{ Chercher = "???"; Remplacer = "?" },
    @{ Chercher = "?? "; Remplacer = "?" },
    @{ Chercher = "???"; Remplacer = "?" },
    @{ Chercher = "???"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" },
    @{ Chercher = "??"; Remplacer = "?" }
)

$totalModifies = 0

foreach ($fichier in $fichiers) {
    $contenu = Get-Content $fichier.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    if ($contenu) {
        $modifie = $false
        foreach ($corr in $corrections) {
            if ($contenu -match $corr.Chercher) {
                $contenu = $contenu -replace $corr.Chercher, $corr.Remplacer
                $modifie = $true
            }
        }
        if ($modifie) {
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($fichier.FullName, $contenu, $utf8NoBom)
            $totalModifies++
            Write-Host "Corrige: $($fichier.Name)" -ForegroundColor Green
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "? $totalModifies fichiers corriges" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nRedemarrez le frontend:" -ForegroundColor Yellow
Write-Host "cd frontend && npm run dev" -ForegroundColor White