const db = require('../config/database');

const Signalement = {
    findAll: async () => {
        const res = await db.query(`
            SELECT s.*, 
                   ARRAY_AGG(DISTINCT st.label ORDER BY st.label) as type_label
            FROM signal_moi.signalements s
            LEFT JOIN signal_moi.signalement_types st ON s.type = st.code
            GROUP BY s.id
            ORDER BY s.created_at DESC
        `);
        return res.rows;
    },
    findByUser: async (userId) => {
        const res = await db.query(`
            SELECT s.*, 
                   ARRAY_AGG(DISTINCT st.label ORDER BY st.label) as type_label
            FROM signal_moi.signalements s
            LEFT JOIN signal_moi.signalement_types st ON s.type = st.code
            WHERE s.user_id = $1
            GROUP BY s.id
            ORDER BY s.created_at DESC
        `, [userId]);
        return res.rows;
    },
    create: async (data) => {
        const { user_id, titre, description, type, localisation, latitude, longitude, image_url, images } = data;
        const res = await db.query(
            `INSERT INTO signal_moi.signalements (user_id, titre, description, type, localisation, latitude, longitude, image_url, images)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [user_id, titre, description, type, localisation, latitude, longitude, image_url, images || '[]']
        );
        return res.rows[0];
    },
    update: async (id, data) => {
        const { titre, description, type, localisation, latitude, longitude, image_url, images, statut } = data;
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (titre !== undefined) { fields.push(`titre = $${paramCount}`); values.push(titre); paramCount++; }
        if (description !== undefined) { fields.push(`description = $${paramCount}`); values.push(description); paramCount++; }
        if (type !== undefined) { fields.push(`type = $${paramCount}`); values.push(type); paramCount++; }
        if (localisation !== undefined) { fields.push(`localisation = $${paramCount}`); values.push(localisation); paramCount++; }
        if (latitude !== undefined) { fields.push(`latitude = $${paramCount}`); values.push(latitude); paramCount++; }
        if (longitude !== undefined) { fields.push(`longitude = $${paramCount}`); values.push(longitude); paramCount++; }
        if (image_url !== undefined) { fields.push(`image_url = $${paramCount}`); values.push(image_url); paramCount++; }
        if (images !== undefined) { fields.push(`images = $${paramCount}`); values.push(images); paramCount++; }
        if (statut !== undefined) { fields.push(`statut = $${paramCount}`); values.push(statut); paramCount++; }

        if (fields.length === 0) return null;

        fields.push(`updated_at = NOW()`);
        values.push(id);

        const res = await db.query(
            `UPDATE signal_moi.signalements SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return res.rows[0];
    },
    updateStatus: async (id, statut) => {
        const res = await db.query('UPDATE signal_moi.signalements SET statut = $1 WHERE id = $2 RETURNING *', [statut, id]);
        return res.rows[0];
    },
    getTypes: async () => {
        const res = await db.query('SELECT * FROM signal_moi.signalement_types WHERE est_actif = true ORDER BY order_index ASC');
        return res.rows;
    }
};

module.exports = Signalement;