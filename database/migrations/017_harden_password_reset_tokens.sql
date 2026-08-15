BEGIN;

CREATE TABLE IF NOT EXISTS signal_moi.password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(64) NOT NULL,
  code_hash TEXT,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE signal_moi.password_reset_tokens
  ADD COLUMN IF NOT EXISTS code_hash TEXT;

-- Older versions accidentally created user_id as INTEGER although users.id is UUID.
-- Preserve any valid rows by rebuilding the column from the associated email.
DO $$
DECLARE user_id_type TEXT;
BEGIN
  SELECT data_type INTO user_id_type
  FROM information_schema.columns
  WHERE table_schema = 'signal_moi'
    AND table_name = 'password_reset_tokens'
    AND column_name = 'user_id';

  IF user_id_type IS DISTINCT FROM 'uuid' THEN
    ALTER TABLE signal_moi.password_reset_tokens ADD COLUMN IF NOT EXISTS user_id_uuid UUID;
    UPDATE signal_moi.password_reset_tokens t
    SET user_id_uuid = u.id
    FROM signal_moi.users u
    WHERE LOWER(u.email) = LOWER(t.email);
    ALTER TABLE signal_moi.password_reset_tokens DROP COLUMN user_id;
    ALTER TABLE signal_moi.password_reset_tokens RENAME COLUMN user_id_uuid TO user_id;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reset_email ON signal_moi.password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_reset_active ON signal_moi.password_reset_tokens(email, expires_at) WHERE used = false;

COMMIT;
