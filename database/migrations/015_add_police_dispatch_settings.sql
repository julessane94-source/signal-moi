-- Routing settings for police reports: each commissariat has a position and
-- may opt in to the signalement types it handles.
CREATE TABLE IF NOT EXISTS signal_moi.police_station_locations (
  commissariat_id UUID PRIMARY KEY REFERENCES signal_moi.users(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (latitude BETWEEN -90 AND 90),
  CHECK (longitude BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS signal_moi.police_signalement_types (
  recipient_id UUID NOT NULL REFERENCES signal_moi.users(id) ON DELETE CASCADE,
  type_code VARCHAR(50) NOT NULL REFERENCES signal_moi.signalement_types(code) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (recipient_id, type_code)
);

CREATE INDEX IF NOT EXISTS idx_police_signalement_types_recipient
  ON signal_moi.police_signalement_types(recipient_id);
