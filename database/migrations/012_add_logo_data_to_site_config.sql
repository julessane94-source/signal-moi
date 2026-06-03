-- Migration 012: Ajouter colonne logo_data pour stocker le logo en base64 dans site_config
-- Date: 2024-06-03
-- Raison: Éviter la perte du logo à chaque redéploiement (système de fichiers éphémère sur Render)

-- S'assurer que la table site_config existe
CREATE TABLE IF NOT EXISTS signal_moi.site_config (
    cle VARCHAR(255) PRIMARY KEY,
    valeur TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ajouter la colonne logo_data si elle n'existe pas
ALTER TABLE signal_moi.site_config
ADD COLUMN IF NOT EXISTS logo_data BYTEA,
ADD COLUMN IF NOT EXISTS logo_filename VARCHAR(255);

-- Créer un index sur logo_data pour les recherches futures
CREATE INDEX IF NOT EXISTS idx_site_config_has_logo ON signal_moi.site_config(cle) WHERE logo_data IS NOT NULL;

-- Ajouter une entrée pour le logo s'il n'existe pas
INSERT INTO signal_moi.site_config (cle, valeur, updated_at)
VALUES ('logoUrl', '/icons/icon-192x192.png', now())
ON CONFLICT (cle) DO NOTHING;
