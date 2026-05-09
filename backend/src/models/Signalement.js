const db = require('../config/database');

const Signalement = {
    findAll: async () => {
        const res = await db.query('SELECT * FROM signalements ORDER BY created_at DESC');
        return res.rows;
    },
    findByUser: async (userId) => {
        const res = await db.query('SELECT * FROM signalements WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        return res.rows;
    },
    create: async (data) => {
        const { user_id, titre, description, type, localisation, latitude, longitude } = data;
        const res = await db.query(
            `INSERT INTO signalements (user_id, titre, description, type, localisation, latitude, longitude)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [user_id, titre, description, type, localisation, latitude, longitude]
        );
        return res.rows[0];
    },
    updateStatus: async (id, statut) => {
        const res = await db.query('UPDATE signalements SET statut = $1 WHERE id = $2 RETURNING *', [statut, id]);
        return res.rows[0];
    }
};

module.exports = Signalement;