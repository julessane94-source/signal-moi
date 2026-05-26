-- Migration 005: Ajouter tables pour campagnes et signatures plaidoyers
-- Compatible Postgres

CREATE SCHEMA IF NOT EXISTS signal_moi;

-- Table inscriptions_campagnes pour les inscriptions aux campagnes
CREATE TABLE IF NOT EXISTS signal_moi.inscriptions_campagnes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campagne_id UUID NOT NULL REFERENCES signal_moi.campagnes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES signal_moi.users(id) ON DELETE CASCADE,
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campagne_id, user_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_inscriptions_campagnes_campagne_id ON signal_moi.inscriptions_campagnes(campagne_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_campagnes_user_id ON signal_moi.inscriptions_campagnes(user_id);

-- Table signatures_plaidoyers pour les signatures de plaidoyers
CREATE TABLE IF NOT EXISTS signal_moi.signatures_plaidoyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plaidoyer_id UUID NOT NULL REFERENCES signal_moi.plaidoyers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES signal_moi.users(id) ON DELETE CASCADE,
    date_signature TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plaidoyer_id, user_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_signatures_plaidoyers_plaidoyer_id ON signal_moi.signatures_plaidoyers(plaidoyer_id);
CREATE INDEX IF NOT EXISTS idx_signatures_plaidoyers_user_id ON signal_moi.signatures_plaidoyers(user_id);

-- Vérifier et ajouter colonne nombre_signatures à plaidoyers si elle n'existe pas
ALTER TABLE IF EXISTS signal_moi.plaidoyers 
ADD COLUMN IF NOT EXISTS nombre_signatures INT DEFAULT 0;

-- Fin migration 005
