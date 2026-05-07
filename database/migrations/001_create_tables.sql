-- Migration 001: Création des tables initiales
-- Date: 2024-01-15

USE signal_moi_db;

-- Vérifier si la table existe déjà
CREATE TABLE IF NOT EXISTS migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enregistrer cette migration
INSERT INTO migrations (migration_name) VALUES ('001_create_tables');

SELECT 'Migration 001 exécutée avec succès' as Status;
