param(
  [string]$DatabaseUrl
)

if (-not $DatabaseUrl) { $DatabaseUrl = $env:DATABASE_URL }
if (-not $DatabaseUrl) {
  Write-Error "ERROR: DATABASE_URL not set. Pass as parameter or set DATABASE_URL environment variable."
  exit 1
}

# Run migrations and seeds
node scripts/sync_models_to_db.js $DatabaseUrl
node scripts/seed_signalements.js $DatabaseUrl

Write-Output "Migrations and seeds completed."
