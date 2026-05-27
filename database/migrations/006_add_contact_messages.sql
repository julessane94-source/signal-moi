-- Migration: Ajouter la table contact_messages pour stocker les messages du formulaire de contact
-- Created: 27-mai-2026

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS signal_moi.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    sujet VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    statut VARCHAR(50) DEFAULT 'nouveau', -- nouveau, en-cours, répondre, fermé
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    notes TEXT -- Notes internes de l'admin
);

-- Créer les index pour les recherches
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON signal_moi.contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_statut ON signal_moi.contact_messages(statut);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON signal_moi.contact_messages(created_at);

COMMENT ON TABLE signal_moi.contact_messages IS 'Messages reçus via le formulaire de contact public';
COMMENT ON COLUMN signal_moi.contact_messages.statut IS 'État du message: nouveau, en-cours, répondre, fermé';
