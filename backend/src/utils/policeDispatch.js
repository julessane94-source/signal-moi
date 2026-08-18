const db = require('../config/database');

// Chaque commissariat reçoit les alertes situées dans un rayon réel de 30 km.
const COVERAGE_RADIUS_KM = 30;
const POLICE_ROLES = ['commissariat', 'police', 'policier', 'gendarmerie', 'force_ordre'];

const findNearestStation = async ({ latitude, longitude, type }) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  try {
    const result = await db.query(`
      SELECT * FROM (
        SELECT u.id, u.quartier,
          (6371 * acos(LEAST(1, GREATEST(-1,
            cos(radians($1)) * cos(radians(psl.latitude::double precision)) *
            cos(radians(psl.longitude::double precision) - radians($2)) +
            sin(radians($1)) * sin(radians(psl.latitude::double precision))
          )))) AS distance_km
        FROM signal_moi.police_station_locations psl
        JOIN signal_moi.users u ON u.id = psl.commissariat_id
        WHERE LOWER(u.role) = 'commissariat' AND u.is_active = true
          AND (NOT EXISTS (SELECT 1 FROM signal_moi.police_signalement_types pst WHERE pst.recipient_id = u.id)
            OR EXISTS (SELECT 1 FROM signal_moi.police_signalement_types pst WHERE pst.recipient_id = u.id AND pst.type_code = $3))
      ) stations
      WHERE distance_km <= $4
      ORDER BY distance_km ASC
      LIMIT 1`, [lat, lng, String(type || '').toLowerCase(), COVERAGE_RADIUS_KM]);
    return result.rows[0] || null;
  } catch (error) {
    // La plateforme continue à fonctionner tant que la migration de dispatch
    // n'a pas encore été appliquée, mais sans orientation automatique.
    if (error.code === '42P01') return null;
    throw error;
  }
};

const getStationRecipients = async (station) => {
  if (!station?.id) return [];
  const result = await db.query(
    `SELECT id FROM signal_moi.users
     WHERE is_active = true
       AND (id = $1 OR (LOWER(role) = ANY($2::text[]) AND LOWER(COALESCE(quartier, '')) = LOWER(COALESCE($3, ''))))`,
    [station.id, POLICE_ROLES, station.quartier || '']
  );
  return result.rows.map((row) => row.id);
};

const assignNearestCommissariat = async (signalement) => {
  const station = await findNearestStation(signalement);
  if (!station || !signalement?.id) return null;
  await db.query('UPDATE signal_moi.signalements SET assigned_to = $1, updated_at = NOW() WHERE id = $2', [station.id, signalement.id]);
  return station;
};

const dispatchLiveToStation = async (io, payload, event) => {
  const station = payload.assignedCommissariatId
    ? { id: payload.assignedCommissariatId, quartier: payload.assignedCommissariatQuartier }
    : await findNearestStation(payload);
  if (!station) {
    // Un live reste visible par les commissariats même lorsqu'aucune position
    // de commissariat compatible n'est encore disponible pour l'affecter.
    io.to('police_room').emit(event, payload);
    return payload;
  }

  const recipientIds = Array.isArray(payload.assignedRecipientIds)
    ? payload.assignedRecipientIds
    : await getStationRecipients(station);
  const dispatchedPayload = {
    ...payload,
    assignedCommissariatId: station.id,
    assignedCommissariatQuartier: station.quartier || '',
    assignedCommissariatDistanceKm: Number(station.distance_km || payload.assignedCommissariatDistanceKm || 0).toFixed(2),
    assignedRecipientIds: recipientIds
  };
  recipientIds.forEach((recipientId) => io.to(`user_${recipientId}`).emit(event, dispatchedPayload));
  // Tous les comptes de l'espace police/commissariat peuvent suivre un direct.
  // Le commissariat couvert reste toutefois le seul à recevoir l'alerte
  // prioritaire et l'affectation du dossier.
  io.to('police_room').emit(event, dispatchedPayload);
  return dispatchedPayload;
};

module.exports = {
  COVERAGE_RADIUS_KM,
  findNearestStation,
  getStationRecipients,
  assignNearestCommissariat,
  dispatchLiveToStation
};
