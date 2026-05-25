-- Migration 003: Ajouter le type de signalement "citoyenne"
-- Date: 2026-05-25

USE signal_moi_db;

INSERT INTO signal_moi.signalement_types (code, label, description, icon, color, est_actif, order_index)
VALUES
  ('citoyenne', 'Signalement citoyen', 'Signalements d\'initiative citoyenne', '🫱', '#2ECC71', true, 13)
ON CONFLICT (code) DO NOTHING;

-- Fin migration 003
