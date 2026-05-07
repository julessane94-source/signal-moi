$fichiers = Get-ChildItem -Recurse -Include "*.js", "*.jsx", "*.tsx"

foreach ($fichier in $fichiers) {
    $contenu = Get-Content $fichier.FullName -Raw -Encoding UTF8
    if ($contenu) {
        # Remplacer les s?quences UTF-8 mal interpr?t?es
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        $contenu = $contenu -replace '??', '?'
        
        # Remplacer les ?motic?nes mal encod?es
        $contenu = $contenu -replace '????', '??'
        $contenu = $contenu -replace '????', '??'
        $contenu = $contenu -replace '????', '??'
        $contenu = $contenu -replace '???', '??'
        $contenu = $contenu -replace '????', '??'
        $contenu = $contenu -replace '????', '??'
        $contenu = $contenu -replace '????', '??'
        $contenu = $contenu -replace '????', '??'
        
        # Sauvegarder
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($fichier.FullName, $contenu, $utf8NoBom)
        Write-Host "Corrige: $($fichier.Name)"
    }
}

Write-Host "Termine! Redemarrez le frontend."