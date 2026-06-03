#!/bin/bash

# Script de correction rapide pour créer la table site_config manquante
# Usage: psql $DATABASE_URL -f database/fix-site-config-table.sql

-- Créer la table site_config si elle n'existe pas
CREATE TABLE IF NOT EXISTS signal_moi.site_config (
    cle VARCHAR(255) PRIMARY KEY,
    valeur TEXT,
    logo_data BYTEA,
    logo_filename VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Créer un index si le logo_data existe
CREATE INDEX IF NOT EXISTS idx_site_config_has_logo ON signal_moi.site_config(cle) WHERE logo_data IS NOT NULL;

-- Initialiser les configurations par défaut
INSERT INTO signal_moi.site_config (cle, valeur, updated_at)
VALUES 
  ('logoUrl', '/icons/icon-192x192.png', now()),
  ('siteName', 'Signal-Moi', now()),
  ('siteDescription', 'Plateforme de signalement civique', now()),
  ('contactEmail', 'julessane94@gmail.com', now()),
  ('contactPhone', '+221778851691', now()),
  ('country', 'SN', now())
ON CONFLICT (cle) DO NOTHING;

-- Confirmer la création
SELECT 'Table site_config créée/vérifiée ✅' as status;
SELECT COUNT(*) as config_count FROM signal_moi.site_config;
