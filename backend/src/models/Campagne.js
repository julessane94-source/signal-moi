const db = require('../config/database');

const Campagne = {
    findAll: async () => {
        const res = await db.query('SELECT * FROM campagnes WHERE est_active = true ORDER BY date_debut ASC');
        return res.rows;
    },
    create: async (data) => {
        const { titre, description, type, date_debut, date_fin, lieu, capacite_max, created_by } = data;
        const res = await db.query(
            `INSERT INTO campagnes (titre, description, type, date_debut, date_fin, lieu, capacite_max, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [titre, description, type, date_debut, date_fin, lieu, capacite_max, created_by]
        );
        return res.rows[0];
    }
};

module.exports = Campagne;