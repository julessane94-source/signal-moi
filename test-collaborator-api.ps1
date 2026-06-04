# Test script for collaborator API endpoints
# Usage: ./test-collaborator-api.ps1 -Token "YOUR_JWT_TOKEN"

param(
    [string]$Token = "",
    [string]$BackendUrl = "https://signal-moi-api.onrender.com"
)

function Test-Endpoint {
    param(
        [string]$Endpoint,
        [string]$Token
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    $url = "$BackendUrl/api/collaborator$Endpoint"
    Write-Host "`n🧪 Testing: $Endpoint"
    Write-Host "URL: $url"
    Write-Host "Token Present: $($Token ? 'Yes' : 'No')`n"
    
    try {
        $response = Invoke-WebRequest -Uri $url -Headers $headers -Method Get -TimeoutSec 10
        Write-Host "✅ Status: $($response.StatusCode)"
        $content = $response.Content | ConvertFrom-Json
        Write-Host "Response:" 
        Write-Host ($content | ConvertTo-Json -Depth 2)
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            Write-Host "Status: $($_.Exception.Response.StatusCode)"
            $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $streamReader.BaseStream.Position = 0
            $errorBody = $streamReader.ReadToEnd()
            Write-Host "Error Response: $errorBody"
        }
    }
}

Write-Host "🔧 Testing Collaborator API Endpoints`n"
Write-Host "Backend: $BackendUrl`n"

# Test without token first
Write-Host "=" * 60
Write-Host "TESTING WITHOUT TOKEN"
Write-Host "=" * 60

Test-Endpoint "/dashboard" ""
Test-Endpoint "/signalements" ""
Test-Endpoint "/campaigns" ""

# Test with token if provided
if ($Token) {
    Write-Host "`n" + "=" * 60
    Write-Host "TESTING WITH TOKEN"
    Write-Host "=" * 60
    
    Test-Endpoint "/dashboard" $Token
    Test-Endpoint "/signalements" $Token
    Test-Endpoint "/campaigns" $Token
    Test-Endpoint "/followed" $Token
} else {
    Write-Host "`n⚠️  No token provided. Endpoints requiring authentication will fail."
    Write-Host "Usage: ./test-collaborator-api.ps1 -Token 'YOUR_JWT_TOKEN'"
}

# Test backend health
Write-Host "`n" + "=" * 60
Write-Host "BACKEND HEALTH CHECK"
Write-Host "=" * 60

try {
    $healthResponse = Invoke-WebRequest -Uri "$BackendUrl/api/health" -Method Get -TimeoutSec 10
    Write-Host "✅ Backend Status: $($healthResponse.StatusCode)"
    $healthContent = $healthResponse.Content | ConvertFrom-Json
    Write-Host ($healthContent | ConvertTo-Json)
} catch {
    Write-Host "❌ Backend Error: $($_.Exception.Message)"
}
