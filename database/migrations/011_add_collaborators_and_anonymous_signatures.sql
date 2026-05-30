-- Migration 011: Support pour collaborateurs et signatures anonymes de plaidoyers
-- Date: 2025-05-28

-- Créer table pour les signatures anonymes de plaidoyers
CREATE TABLE IF NOT EXISTS signal_moi.signatures_plaidoyers_anonymes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plaidoyer_id UUID NOT NULL REFERENCES signal_moi.plaidoyers(id),
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  date_signature TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(plaidoyer_id, email)
);

CREATE INDEX IF NOT EXISTS idx_sig_plaid_anonymes_plaidoyer ON signal_moi.signatures_plaidoyers_anonymes(plaidoyer_id);
CREATE INDEX IF NOT EXISTS idx_sig_plaid_anonymes_email ON signal_moi.signatures_plaidoyers_anonymes(email);

-- Ajouter contrainte UNIQUE sur signatures_plaidoyers (si elle n'existe pas)
ALTER TABLE signal_moi.signatures_plaidoyers
ADD CONSTRAINT IF NOT EXISTS unique_plaidoyer_user UNIQUE(plaidoyer_id, user_id);

-- Ajouter index sur date_signature pour performance
CREATE INDEX IF NOT EXISTS idx_sig_plaid_date ON signal_moi.signatures_plaidoyers(date_signature);

SELECT 'Migration 011 exécutée avec succès' as Status;
