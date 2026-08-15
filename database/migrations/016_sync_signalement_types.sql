-- Synchronise les types de signalement visibles par les citoyens,
-- collaborateurs et commissariats.
BEGIN;

CREATE TABLE IF NOT EXISTS signal_moi.signalement_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  color VARCHAR(20),
  est_actif BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Compatible avec les installations où la migration 014 n'a pas encore été lancée.
CREATE TABLE IF NOT EXISTS signal_moi.collaborator_signalement_types (
  collaborator_id UUID NOT NULL REFERENCES signal_moi.users(id) ON DELETE CASCADE,
  type_code VARCHAR(50) NOT NULL REFERENCES signal_moi.signalement_types(code) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (collaborator_id, type_code)
);

CREATE INDEX IF NOT EXISTS idx_collaborator_signalement_types_collaborator
  ON signal_moi.collaborator_signalement_types(collaborator_id);

INSERT INTO signal_moi.signalement_types (code, label, description, icon, color, est_actif, order_index)
VALUES
  ('nid_de_poule', 'Nid de poule', 'Routes endommagées', '🚗', '#FF6B6B', true, 1),
  ('dechet', 'Déchets', 'Déchets sauvages', '🗑️', '#FFA500', true, 2),
  ('eau_sale', 'Eau sale', 'Pollution de l’eau', '💧', '#4A90E2', true, 3),
  ('bruit', 'Bruit', 'Nuisance sonore', '🔊', '#9B59B6', true, 4),
  ('insecurite', 'Insécurité', 'Problème de sécurité', '🚨', '#E74C3C', true, 5),
  ('sante', 'Santé', 'Problème de santé publique', '⚕️', '#27AE60', true, 6),
  ('education', 'Éducation', 'Problème éducatif', '📚', '#3498DB', true, 7),
  ('electricite', 'Électricité', 'Problème électrique', '⚡', '#F1C40F', true, 8),
  ('eau_potable', 'Eau potable', 'Accès à l’eau potable', '💦', '#1ABC9C', true, 9),
  ('transport', 'Transport', 'Problème de transport', '🚌', '#E67E22', true, 10),
  ('environnement', 'Environnement', 'Problème environnemental', '🌍', '#16A085', true, 11),
  ('autre', 'Autre', 'Autre type de signalement', '❓', '#95A5A6', true, 12)
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  est_actif = true,
  order_index = EXCLUDED.order_index,
  updated_at = NOW();

-- Ancien code utilisé par une première version de la base.
UPDATE signal_moi.signalements SET type = 'nid_de_poule' WHERE type = 'nid_poule';

INSERT INTO signal_moi.collaborator_signalement_types (collaborator_id, type_code)
SELECT collaborator_id, 'nid_de_poule'
FROM signal_moi.collaborator_signalement_types
WHERE type_code = 'nid_poule'
ON CONFLICT (collaborator_id, type_code) DO NOTHING;

INSERT INTO signal_moi.police_signalement_types (recipient_id, type_code)
SELECT recipient_id, 'nid_de_poule'
FROM signal_moi.police_signalement_types
WHERE type_code = 'nid_poule'
ON CONFLICT (recipient_id, type_code) DO NOTHING;

DELETE FROM signal_moi.signalement_types WHERE code = 'nid_poule';

COMMIT;
