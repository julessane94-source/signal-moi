Write-Host "Remplacement des accents dans tous les fichiers..." -ForegroundColor Cyan

$remplacements = @(
    @{ Chercher = "?"; Remplacer = "e" },
    @{ Chercher = "?"; Remplacer = "e" },
    @{ Chercher = "?"; Remplacer = "e" },
    @{ Chercher = "?"; Remplacer = "e" },
    @{ Chercher = "?"; Remplacer = "a" },
    @{ Chercher = "?"; Remplacer = "a" },
    @{ Chercher = "?"; Remplacer = "a" },
    @{ Chercher = "?"; Remplacer = "i" },
    @{ Chercher = "?"; Remplacer = "i" },
    @{ Chercher = "?"; Remplacer = "o" },
    @{ Chercher = "?"; Remplacer = "o" },
    @{ Chercher = "?"; Remplacer = "u" },
    @{ Chercher = "?"; Remplacer = "u" },
    @{ Chercher = "?"; Remplacer = "u" },
    @{ Chercher = "?"; Remplacer = "c" },
    @{ Chercher = "?"; Remplacer = "E" },
    @{ Chercher = "?"; Remplacer = "E" },
    @{ Chercher = "?"; Remplacer = "E" },
    @{ Chercher = "?"; Remplacer = "A" },
    @{ Chercher = "?"; Remplacer = "A" },
    @{ Chercher = "?"; Remplacer = "I" },
    @{ Chercher = "?"; Remplacer = "O" },
    @{ Chercher = "?"; Remplacer = "U" },
    @{ Chercher = "?"; Remplacer = "C" },
    @{ Chercher = "?"; Remplacer = "oe" }
)

$fichiers = Get-ChildItem -Path "frontend\src" -Recurse -Include "*.js", "*.jsx", "*.tsx", "*.json"

$compteur = 0
foreach ($fichier in $fichiers) {
    $contenu = Get-Content $fichier.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    if ($contenu) {
        $modifie = $false
        foreach ($rem in $remplacements) {
            if ($contenu -match $rem.Chercher) {
                $contenu = $contenu -replace $rem.Chercher, $rem.Remplacer
                $modifie = $true
            }
        }
        if ($modifie) {
            $Utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($fichier.FullName, $contenu, $Utf8NoBom)
            $compteur++
            Write-Host "Corrige: $($fichier.Name)"
        }
    }
}

Write-Host "`n$compteur fichiers modifies sans accents" -ForegroundColor Green
Write-Host "Redemarrez le frontend: npm run dev" -ForegroundColor Yellow