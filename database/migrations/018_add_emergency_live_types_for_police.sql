-- Emergency types used by citizen live sessions.
-- They are enabled for existing police stations so type filtering cannot
-- block assignment of urgent cases.
BEGIN;

INSERT INTO signal_moi.signalement_types (code, label, description, icon, color, est_actif, order_index)
VALUES
  ('violence', 'Violence / danger', 'Agression, menace ou personne en danger', '!', '#DC2626', true, 0),
  ('vol', 'Vol en cours', 'Vol, cambriolage ou agression avec vol', '$', '#A16207', true, 0),
  ('accident', 'Accident / blessure', 'Accident, blessure ou urgence de secours', '+', '#EA580C', true, 0)
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  est_actif = true,
  order_index = EXCLUDED.order_index,
  updated_at = NOW();

-- Existing police stations receive the three emergency types on migration.
INSERT INTO signal_moi.police_signalement_types (recipient_id, type_code)
SELECT u.id, emergency_type.code
FROM signal_moi.users u
CROSS JOIN (VALUES ('violence'), ('vol'), ('accident')) AS emergency_type(code)
WHERE LOWER(u.role) = 'commissariat' AND u.is_active = true
ON CONFLICT (recipient_id, type_code) DO NOTHING;

COMMIT;
