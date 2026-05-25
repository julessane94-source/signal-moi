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
  }
};

module.exports = FollowedCase;
