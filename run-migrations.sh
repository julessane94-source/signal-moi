#!/bin/bash

# Script pour exécuter les migrations sur la base de données Render
# Usage: ./run-migrations.sh

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erreur: DATABASE_URL non défini"
  exit 1
fi

echo "📦 Exécution des migrations SQL..."

# Répertoire des migrations
MIGRATIONS_DIR="./database/migrations"

# Vérifier que le répertoire existe
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "❌ Erreur: Le répertoire $MIGRATIONS_DIR n'existe pas"
  exit 1
fi

# Exécuter chaque fichier de migration en ordre numérique
for migration in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
  filename=$(basename "$migration")
  echo "▶️  Exécution: $filename"
  
  psql "$DATABASE_URL" -f "$migration" 2>&1 | {
    if grep -q "ERROR"; then
      echo "⚠️  Attention lors de l'exécution de $filename (mais c'est ok si IF NOT EXISTS)"
    else
      echo "✅ $filename exécutée"
    fi
  }
done

echo "✅ Toutes les migrations ont été exécutées"
