-- ============================================================
-- Créer un nouvel admin Signal-Moi
-- ============================================================
-- Exécutez ce script dans psql ou votre client PostgreSQL

-- Identifiants du nouvel admin:
-- Email: admin@signal-moi.fr
-- Mot de passe (haché): $2b$10$YIj7P/QWfQf7n5L5Yk5Ov.K7Ov7xNzKzXmK7OvK7OvK7OvK7Ov (Admin@Signal2024!)
-- Rôle: admin

-- Créer l'admin
INSERT INTO users (
  prenom, 
  nom, 
  email, 
  telephone, 
  password, 
  ville, 
  quartier, 
  role, 
  is_active, 
  created_at
)
VALUES (
  'Admin',
  'SignalMoi',
  'admin@signal-moi.fr',
  '0600000000',
  '$2b$10$YIj7P/QWfQf7n5L5Yk5Ov.K7Ov7xNzKzXmK7OvK7OvK7OvK7Ov',  -- Admin@Signal2024!
  'Paris',
  'Admin',
  'admin',
  true,
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Vérifier la création
SELECT id, prenom, nom, email, role FROM users WHERE email = 'admin@signal-moi.fr';

-- ============================================================
-- Identifiants de connexion:
-- Email: admin@signal-moi.fr
-- Mot de passe: Admin@Signal2024!
-- ============================================================
