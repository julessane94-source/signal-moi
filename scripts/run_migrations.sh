#!/usr/bin/env bash
set -euo pipefail

DB_URL="${1:-$DATABASE_URL}"
if [ -z "$DB_URL" ]; then
  echo "ERROR: DATABASE_URL not set. Pass as first argument or set DATABASE_URL env var."
  exit 1
fi

# Run Sequelize sync and seeds (executed from repo root)
node scripts/sync_models_to_db.js "$DB_URL"
node scripts/seed_signalements.js "$DB_URL"

echo "Migrations and seeds completed."
