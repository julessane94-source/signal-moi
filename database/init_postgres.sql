-- Minimal Postgres schema for signal-moi (compatible avec les modèles et wrappers)
-- Creates schema 'signal_moi' and core tables. Safe to run on an empty DB.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS signal_moi;

SET search_path = signal_moi, public;

-- users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom VARCHAR(50) NOT NULL,
  nom VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telephone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  ville VARCHAR(100),
  quartier VARCHAR(100),
  date_naissance DATE,
  lieu_naissance VARCHAR(100),
  role VARCHAR(50) DEFAULT 'citoyen',
  is_active BOOLEAN DEFAULT true,
  avatar VARCHAR(500),
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP,
  last_login TIMESTAMP,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- signalements
CREATE TABLE IF NOT EXISTS signalements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  titre VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(100),
  statut VARCHAR(50) DEFAULT 'nouveau',
  priorite VARCHAR(50) DEFAULT 'moyenne',
  localisation VARCHAR(255),
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  adresse TEXT,
  est_anonyme BOOLEAN DEFAULT false,
  assigned_to UUID,
  transferred_from UUID,
  date_signalement TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date_resolution TIMESTAMP,
  commentaire_resolution TEXT,
  views_count INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signalements_user ON signalements(user_id);
CREATE INDEX IF NOT EXISTS idx_signalements_statut ON signalements(statut);

-- fichiers
CREATE TABLE IF NOT EXISTS fichiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signalement_id UUID NOT NULL,
  nom_fichier VARCHAR(255) NOT NULL,
  chemin VARCHAR(500) NOT NULL,
  type VARCHAR(20) NOT NULL,
  taille INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  is_verified BOOLEAN DEFAULT false,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fichiers_signalement ON fichiers(signalement_id);

-- campagnes
CREATE TABLE IF NOT EXISTS campagnes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(100),
  date_debut TIMESTAMP,
  date_fin TIMESTAMP,
  lieu VARCHAR(255),
  adresse TEXT,
  capacite_max INTEGER DEFAULT 100,
  prix NUMERIC(10,2) DEFAULT 0,
  created_by UUID,
  est_actif BOOLEAN DEFAULT true,
  image_url VARCHAR(500),
  banner_url VARCHAR(500),
  programme TEXT,
  prerequis TEXT,
  materiel TEXT,
  contact_organisateur VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- inscriptions_campagnes
CREATE TABLE IF NOT EXISTS inscriptions_campagnes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  campagne_id UUID NOT NULL,
  statut VARCHAR(50) DEFAULT 'inscrit',
  date_inscription TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date_presence TIMESTAMP,
  code_qr VARCHAR(255),
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_inscription ON inscriptions_campagnes(user_id, campagne_id);

-- messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediteur_id UUID NOT NULL,
  destinataire_id UUID NOT NULL,
  signalement_id UUID,
  contenu TEXT NOT NULL,
  est_lu BOOLEAN DEFAULT false,
  date_lecture TIMESTAMP,
  pieces_jointes JSONB,
  is_deleted_by_sender BOOLEAN DEFAULT false,
  is_deleted_by_receiver BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  titre VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  lien VARCHAR(500),
  reference_id UUID,
  est_lu BOOLEAN DEFAULT false,
  date_lecture TIMESTAMP,
  est_envoyee BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- plaidoyers
CREATE TABLE IF NOT EXISTS plaidoyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  contenu TEXT NOT NULL,
  auteur_id UUID NOT NULL,
  signatures INTEGER DEFAULT 0,
  objectif_signatures INTEGER DEFAULT 0,
  categorie VARCHAR(100),
  statut VARCHAR(50) DEFAULT 'en_cours',
  date_limite TIMESTAMP,
  image_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- signatures_plaidoyers
CREATE TABLE IF NOT EXISTS signatures_plaidoyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plaidoyer_id UUID NOT NULL,
  user_id UUID NOT NULL,
  commentaire TEXT,
  date_signature TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- historiques_signalements
CREATE TABLE IF NOT EXISTS historiques_signalements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signalement_id UUID NOT NULL,
  utilisateur_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  ancien_statut VARCHAR(50),
  nouveau_statut VARCHAR(50),
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- logs_activite (id as bigserial)
CREATE TABLE IF NOT EXISTS logs_activite (
  id BIGSERIAL PRIMARY KEY,
  utilisateur_id UUID,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- sessions
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id UUID,
  data TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Simple indexes
CREATE INDEX IF NOT EXISTS idx_messages_expediteur ON messages(expediteur_id);
CREATE INDEX IF NOT EXISTS idx_messages_destinataire ON messages(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_fichiers_type ON fichiers(type);

-- End of file
