-- Migration 004: Table followed_cases pour le suivi des dossiers
-- Compatible Postgres

CREATE SCHEMA IF NOT EXISTS signal_moi;

CREATE TABLE IF NOT EXISTS signal_moi.followed_cases (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  signalement_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_followed_unique ON signal_moi.followed_cases (user_id, signalement_id);
CREATE INDEX IF NOT EXISTS idx_followed_signalement ON signal_moi.followed_cases (signalement_id);

-- Fin migration 004
