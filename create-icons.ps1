Write-Host "Creation des icones PWA..." -ForegroundColor Cyan

$icons = @(
    "16x16", "32x32", "72x72", "96x96", 
    "128x128", "144x144", "152x152", 
    "192x192", "384x384", "512x512"
)

$publicPath = "$PSScriptRoot\frontend\public\icons"

foreach ($size in $icons) {
    $filePath = "$publicPath\icon-$size.png"
    if (-not (Test-Path $filePath)) {
        # Cr?er un fichier vide pour l'instant
        New-Item -Path $filePath -ItemType File -Force | Out-Null
        Write-Host "Cree: icon-$size.png" -ForegroundColor Green
    }
}

Write-Host "`nPour des veritables icones, utilisez: https://www.pwabuilder.com/" -ForegroundColor Yellow