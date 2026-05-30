$response = Invoke-WebRequest -Uri 'https://signal-moi-api.onrender.com/api/health' -TimeoutSec 10 -SkipHttpErrorCheck
Write-Host "Status: $($response.StatusCode)"
Write-Host "Content: $($response.Content)"
