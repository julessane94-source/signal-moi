-- Ajouter colonnes image aux signalements
ALTER TABLE signal_moi.signalements ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE signal_moi.signalements ADD COLUMN IF NOT EXISTS images TEXT DEFAULT '[]'; -- JSON array pour multiple images

-- Créer table pour les types de signalements (extensible)
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

-- Insérer les types de signalements par défaut
INSERT INTO signal_moi.signalement_types (code, label, description, icon, color, est_actif, order_index) VALUES
  ('nid_poule', 'Nid de poule', 'Routes endommagées', '🚗', '#FF6B6B', true, 1),
  ('dechet', 'Déchets', 'Déchets sauvages', '🗑️', '#FFA500', true, 2),
  ('eau_sale', 'Eau sale', 'Pollution de l''eau', '💧', '#4A90E2', true, 3),
  ('bruit', 'Bruit', 'Nuisance sonore', '🔊', '#9B59B6', true, 4),
  ('insecurite', 'Insécurité', 'Problème de sécurité', '🚨', '#E74C3C', true, 5),
  ('sante', 'Santé', 'Problème de santé publique', '⚕️', '#27AE60', true, 6),
  ('education', 'Éducation', 'Problème éducatif', '📚', '#3498DB', true, 7),
  ('electricite', 'Électricité', 'Problème électrique', '⚡', '#F1C40F', true, 8),
  ('eau_potable', 'Eau potable', 'Accès eau potable', '💦', '#1ABC9C', true, 9),
  ('transport', 'Transport', 'Problème de transport', '🚌', '#E67E22', true, 10),
  ('environnement', 'Environnement', 'Problème environnemental', '🌍', '#16A085', true, 11),
  ('autre', 'Autre', 'Autre type de signalement', '❓', '#95A5A6', true, 12)
ON CONFLICT (code) DO NOTHING;

-- Ajouter indices
CREATE INDEX IF NOT EXISTS idx_signalement_types_code ON signal_moi.signalement_types(code);
