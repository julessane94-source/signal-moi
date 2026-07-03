const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const FollowedCase = {
  add: async (userId, signalementId) => {
    const id = uuidv4();
    await db.query(
      `INSERT INTO signal_moi.followed_cases (id, user_id, signalement_id, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [id, userId, signalementId]
    );
    return { id, userId, signalementId };
  },
  remove: async (userId, signalementId) => {
    await db.query(`DELETE FROM signal_moi.followed_cases WHERE user_id = $1 AND signalement_id = $2`, [userId, signalementId]);
    return true;
  },
  listByUser: async (userId) => {
    const res = await db.query(`
      SELECT fc.signalement_id as id, s.titre, s.description, s.statut, s.created_at
      FROM signal_moi.followed_cases fc
      LEFT JOIN signal_moi.signalements s ON s.id = fc.signalement_id
      WHERE fc.user_id = $1
      ORDER BY fc.created_at DESC
    `, [userId]);
    return res.rows;
  },
  followersByCase: async (signalementId) => {
    const res = await db.query(`SELECT user_id FROM signal_moi.followed_cases WHERE signalement_id = $1`, [signalementId]);
    return res.rows.map(r => r.user_id);
  },
  followersDetailsByCase: async (signalementId) => {
    const res = await db.query(`
      SELECT
        fc.user_id,
        fc.created_at AS followed_at,
        u.prenom,
        u.nom,
        u.email,
        u.telephone,
        u.role
      FROM signal_moi.followed_cases fc
      LEFT JOIN signal_moi.users u ON u.id = fc.user_id
      WHERE fc.signalement_id = $1
        AND LOWER(COALESCE(u.role, '')) IN ('collaborateur', 'collaborator')
      ORDER BY fc.created_at DESC
    `, [signalementId]);

    return res.rows.map(row => ({
      id: row.user_id,
      prenom: row.prenom,
      nom: row.nom,
      email: row.email,
      telephone: row.telephone,
      role: row.role,
      followedAt: row.followed_at
    }));
  }
};

module.exports = FollowedCase;
