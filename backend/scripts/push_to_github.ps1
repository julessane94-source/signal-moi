if (-not $env:GITHUB_TOKEN) { Write-Error 'GITHUB_TOKEN not set'; exit 1 }
$repo = 'signal-moi'

try {
  $user = Invoke-RestMethod -Uri 'https://api.github.com/user' -Headers @{ Authorization = "token $env:GITHUB_TOKEN"; 'User-Agent'='powershell' } -ErrorAction Stop
  $username = $user.login
} catch {
  Write-Error ("GitHub authentication failed: " + $_.Exception.Message)
  exit 1
}

try {
  $body = @{ name = $repo; private = $false } | ConvertTo-Json
  $resp = Invoke-RestMethod -Uri 'https://api.github.com/user/repos' -Method POST -Headers @{ Authorization = "token $env:GITHUB_TOKEN"; 'User-Agent'='powershell' } -Body $body -ContentType 'application/json' -ErrorAction Stop
  Write-Output ("Repo created: " + $resp.full_name)
} catch {
  Write-Output ('Create repo: ' + $_.Exception.Message)
}

Set-Location 'C:\Users\MACHINE 2\Desktop\signal-moi'
try { git remote remove origin } catch {}
$remoteUrl = "https://${username}:${env:GITHUB_TOKEN}@github.com/${username}/${repo}.git"
git remote add origin $remoteUrl
git branch -M master

$pushResult = & git push -u origin master 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Error ("Git push failed: " + ($pushResult -join "`n"))
  exit 1
}

try {
  git remote set-url origin "https://github.com/${username}/${repo}.git"
} catch {}

Remove-Item Env:GITHUB_TOKEN -ErrorAction SilentlyContinue
Write-Output 'Push complete'
