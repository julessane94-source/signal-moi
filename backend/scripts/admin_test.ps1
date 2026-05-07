$out = Join-Path (Get-Location) 'login_response.json'
$body = @{ 
  email = 'admin@signal-moi.com'
  password = 'Admin123!'
}
try {
  $res = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body ($body | ConvertTo-Json -Depth 10) -ContentType 'application/json' -UseBasicParsing
  ($res | ConvertTo-Json -Compress) | Out-File -Encoding utf8 $out
  Write-Output $out
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
