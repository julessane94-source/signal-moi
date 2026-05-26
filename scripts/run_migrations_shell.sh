#!/bin/bash
# Script pour exécuter les migrations

set -e

DB_URL="${DATABASE_URL:-postgres://localhost/signal_moi_db}"

echo "🔧 Exécution des migrations..."

# Migration 005
echo "▶️ Exécution migration 005 (campagnes, plaidoyers)..."
psql "$DB_URL" -f database/migrations/005_add_campagnes_inscriptions.sql

echo "✅ Toutes les migrations exécutées avec succès!"
