const db = require('../config/database');

const User = {
    findAll: async () => {
        const res = await db.query('SELECT id, prenom, nom, email, telephone, ville, quartier, role, is_active, created_at FROM users ORDER BY created_at DESC');
        return res.rows;
    },
    findById: async (id) => {
        const res = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        return res.rows[0];
    },
    create: async (userData) => {
        const { prenom, nom, email, telephone, password, ville, quartier, role } = userData;
        const res = await db.query(
            `INSERT INTO users (prenom, nom, email, telephone, password, ville, quartier, role)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, prenom, nom, email, role, is_active`,
            [prenom, nom, email, telephone, password || 'Default123!', ville, quartier, role || 'citoyen']
        );
        return res.rows[0];
    },
    update: async (id, updates) => {
        const fields = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = fields.map((f, idx) => `${f} = $${idx + 1}`).join(', ');
        const res = await db.query(
            `UPDATE users SET ${setClause} WHERE id = $${fields.length + 1} RETURNING id, prenom, nom, email, role, is_active`,
            [...values, id]
        );
        return res.rows[0];
    },
    delete: async (id) => {
        await db.query('DELETE FROM users WHERE id = $1', [id]);
    },
    updateRole: async (id, role) => {
        const res = await db.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role', [role, id]);
        return res.rows[0];
    },
    resetPassword: async (id, newPassword = 'Default123!') => {
        await db.query('UPDATE users SET password = $1 WHERE id = $2', [newPassword, id]);
    }
};

module.exports = User;