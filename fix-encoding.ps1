Write-Host "Reconversion des fichiers en UTF-8..." -ForegroundColor Cyan

$folders = @(
    "frontend\src\pages",
    "frontend\src\components\common",
    "frontend\src\context",
    "frontend\src\layouts"
)

foreach ($folder in $folders) {
    $fullPath = Join-Path $PSScriptRoot $folder
    if (Test-Path $fullPath) {
        Get-ChildItem -Path $fullPath -Filter "*.js" -Recurse | ForEach-Object {
            Write-Host "Traitement: $($_.Name)" -ForegroundColor Yellow
            $content = Get-Content $_.FullName -Raw -Encoding UTF8
            # Sauvegarder en UTF-8 sans BOM
            $Utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($_.FullName, $content, $Utf8NoBom)
        }
    }
}

Write-Host "Termine!" -ForegroundColor Green