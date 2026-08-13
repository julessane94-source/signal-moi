-- Types de signalements pris en charge par chaque collaborateur.
CREATE TABLE IF NOT EXISTS signal_moi.collaborator_signalement_types (
  collaborator_id UUID NOT NULL REFERENCES signal_moi.users(id) ON DELETE CASCADE,
  type_code VARCHAR(50) NOT NULL REFERENCES signal_moi.signalement_types(code) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (collaborator_id, type_code)
);

CREATE INDEX IF NOT EXISTS idx_collaborator_signalement_types_collaborator
  ON signal_moi.collaborator_signalement_types(collaborator_id);

CREATE INDEX IF NOT EXISTS idx_collaborator_signalement_types_type
  ON signal_moi.collaborator_signalement_types(type_code);
