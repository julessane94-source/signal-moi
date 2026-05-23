const db = require('../config/database');

const InscriptionCampagne = {
    findAll: async () => {
        const res = await db.query('SELECT * FROM inscriptions_campagnes ORDER BY date_inscription DESC');
        return res.rows;
    },

    findById: async (id) => {
        const res = await db.query('SELECT * FROM inscriptions_campagnes WHERE id = $1', [id]);
        return res.rows[0] || null;
    },

    findByCampagne: async (campagneId) => {
        const res = await db.query(
            `SELECT * FROM inscriptions_campagnes WHERE campagne_id = $1 ORDER BY date_inscription DESC`,
            [campagneId]
        );
        return res.rows;
    },

    findByUser: async (userId) => {
        const res = await db.query(
            `SELECT * FROM inscriptions_campagnes WHERE user_id = $1 ORDER BY date_inscription DESC`,
            [userId]
        );
        return res.rows;
    },

    findByUserAndCampagne: async (userId, campagneId) => {
        const res = await db.query(
            `SELECT * FROM inscriptions_campagnes WHERE user_id = $1 AND campagne_id = $2`,
            [userId, campagneId]
        );
        return res.rows[0] || null;
    },

    create: async (data) => {
        const { id, userId, campagneId, statut, dateInscription, datePresence, codeQr, commentaire } = data;
        const res = await db.query(
            `INSERT INTO inscriptions_campagnes (id, user_id, campagne_id, statut, date_inscription, date_presence, code_qr, commentaire)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [id, userId, campagneId, statut || 'inscrit', dateInscription || new Date(), datePresence || null, codeQr || null, commentaire || null]
        );
        return res.rows[0];
    },

    updateStatut: async (id, statut) => {
        const res = await db.query(
            `UPDATE inscriptions_campagnes SET statut = $1 WHERE id = $2 RETURNING *`,
            [statut, id]
        );
        return res.rows[0];
    },

    updateDatePresence: async (id, datePresence) => {
        const res = await db.query(
            `UPDATE inscriptions_campagnes SET date_presence = $1, statut = 'present' WHERE id = $2 RETURNING *`,
            [datePresence, id]
        );
        return res.rows[0];
    },

    update: async (id, data) => {
        const fields = [];
        const values = [];
        let paramIndex = 1;

        Object.entries(data).forEach(([key, value]) => {
            const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            fields.push(`${dbKey} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        });

        if (fields.length === 0) return null;

        values.push(id);
        const res = await db.query(
            `UPDATE inscriptions_campagnes SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );
        return res.rows[0] || null;
    },

    delete: async (id) => {
        await db.query('DELETE FROM inscriptions_campagnes WHERE id = $1', [id]);
    },

    deleteByUserAndCampagne: async (userId, campagneId) => {
        await db.query(
            'DELETE FROM inscriptions_campagnes WHERE user_id = $1 AND campagne_id = $2',
            [userId, campagneId]
        );
    },

    countParticipants: async (campagneId) => {
        const res = await db.query(
            `SELECT COUNT(*) as count FROM inscriptions_campagnes WHERE campagne_id = $1`,
            [campagneId]
        );
        return parseInt(res.rows[0].count) || 0;
    },

    countByStatut: async (campagneId, statut) => {
        const res = await db.query(
            `SELECT COUNT(*) as count FROM inscriptions_campagnes WHERE campagne_id = $1 AND statut = $2`,
            [campagneId, statut]
        );
        return parseInt(res.rows[0].count) || 0;
    }
};

module.exports = InscriptionCampagne;
