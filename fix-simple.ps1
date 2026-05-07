Write-Host "Correction simple des accents..." -ForegroundColor Cyan

$fichiers = Get-ChildItem -Path "frontend\src" -Recurse -Include "*.js", "*.jsx", "*.json", "*.css"

foreach ($fichier in $fichiers) {
    $contenu = Get-Content $fichier.FullName -Raw -Encoding UTF8
    if ($contenu) {
        # Remplacer les caract?res probl?matiques
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "???", "'"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        $contenu = $contenu -replace "??", "?"
        
        $Utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($fichier.FullName, $contenu, $Utf8NoBom)
        Write-Host "Corrige: $($fichier.Name)"
    }
}

Write-Host "Termine! Redemarrez le frontend." -ForegroundColor Green