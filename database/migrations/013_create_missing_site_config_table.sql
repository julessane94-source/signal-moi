-- Migration 013: Créer la table site_config manquante
-- Date: 2026-06-03
-- Raison: Correction d'erreur - la table site_config n'existe pas sur la BD de production

-- Créer la table site_config avec toutes les colonnes nécessaires
CREATE TABLE IF NOT EXISTS signal_moi.site_config (
    cle VARCHAR(255) PRIMARY KEY,
    valeur TEXT,
    logo_data BYTEA,
    logo_filename VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Créer un index sur logo_data pour les recherches futures
CREATE INDEX IF NOT EXISTS idx_site_config_has_logo ON signal_moi.site_config(cle) WHERE logo_data IS NOT NULL;

-- Ajouter une entrée de configuration par défaut pour le logo s'il n'existe pas
INSERT INTO signal_moi.site_config (cle, valeur, updated_at)
VALUES ('logoUrl', '/icons/icon-192x192.png', now())
ON CONFLICT (cle) DO NOTHING;

-- Ajouter d'autres configurations par défaut
INSERT INTO signal_moi.site_config (cle, valeur, updated_at)
VALUES 
  ('siteName', 'Signal-Moi', now()),
  ('siteDescription', 'Plateforme de signalement civique', now()),
  ('contactEmail', 'julessane94@gmail.com', now()),
  ('contactPhone', '+221778851691', now()),
  ('country', 'SN', now())
ON CONFLICT (cle) DO NOTHING;
