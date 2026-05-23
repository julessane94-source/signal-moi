const db = require('../config/database');

const Message = {
    findAll: async () => {
        const res = await db.query('SELECT * FROM messages ORDER BY created_at DESC');
        return res.rows;
    },

    findById: async (id) => {
        const res = await db.query('SELECT * FROM messages WHERE id = $1', [id]);
        return res.rows[0] || null;
    },

    findByUser: async (userId) => {
        const res = await db.query(
            `SELECT * FROM messages 
             WHERE (expediteur_id = $1 OR destinataire_id = $1) 
             AND is_deleted_by_sender = false AND is_deleted_by_receiver = false
             ORDER BY created_at DESC`,
            [userId]
        );
        return res.rows;
    },

    findBetweenUsers: async (userId1, userId2) => {
        const res = await db.query(
            `SELECT * FROM messages 
             WHERE (expediteur_id = $1 AND destinataire_id = $2) 
             OR (expediteur_id = $2 AND destinataire_id = $1)
             ORDER BY created_at ASC`,
            [userId1, userId2]
        );
        return res.rows;
    },

    create: async (data) => {
        const { id, expediteurId, destinataireId, signalementId, contenu, piecesJointes } = data;
        const res = await db.query(
            `INSERT INTO messages (id, expediteur_id, destinataire_id, signalement_id, contenu, pieces_jointes)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [id, expediteurId, destinataireId, signalementId || null, contenu, piecesJointes || null]
        );
        return res.rows[0];
    },

    markAsRead: async (messageId) => {
        const res = await db.query(
            `UPDATE messages SET est_lu = true, date_lecture = NOW() WHERE id = $1 RETURNING *`,
            [messageId]
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
            `UPDATE messages SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );
        return res.rows[0] || null;
    },

    delete: async (id) => {
        await db.query('DELETE FROM messages WHERE id = $1', [id]);
    },

    softDeleteBySender: async (messageId) => {
        const res = await db.query(
            `UPDATE messages SET is_deleted_by_sender = true WHERE id = $1 RETURNING *`,
            [messageId]
        );
        return res.rows[0];
    },

    softDeleteByReceiver: async (messageId) => {
        const res = await db.query(
            `UPDATE messages SET is_deleted_by_receiver = true WHERE id = $1 RETURNING *`,
            [messageId]
        );
        return res.rows[0];
    }
};

module.exports = Message;
