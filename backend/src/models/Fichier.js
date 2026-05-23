const db = require('../config/database');

const Fichier = {
    findAll: async () => {
        const res = await db.query('SELECT * FROM fichiers ORDER BY created_at DESC');
        return res.rows;
    },

    findById: async (id) => {
        const res = await db.query('SELECT * FROM fichiers WHERE id = $1', [id]);
        return res.rows[0] || null;
    },

    findBySignalementId: async (signalementId) => {
        const res = await db.query('SELECT * FROM fichiers WHERE signalement_id = $1 ORDER BY created_at DESC', [signalementId]);
        return res.rows;
    },

    create: async (data) => {
        const { id, signalementId, nomFichier, chemin, type, taille, mimeType, description, isVerified, uploadedBy } = data;
        const res = await db.query(
            `INSERT INTO fichiers (id, signalement_id, nom_fichier, chemin, type, taille, mime_type, description, is_verified, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [id, signalementId, nomFichier, chemin, type, taille, mimeType, description || null, isVerified || false, uploadedBy || null]
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
            `UPDATE fichiers SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );
        return res.rows[0] || null;
    },

    delete: async (id) => {
        await db.query('DELETE FROM fichiers WHERE id = $1', [id]);
    },

    deleteBySignalementId: async (signalementId) => {
        await db.query('DELETE FROM fichiers WHERE signalement_id = $1', [signalementId]);
    },

    getUrl: (chemin) => {
        if (!chemin) return null;
        if (chemin.startsWith('http')) return chemin;
        if (process.env.USE_S3 === 'true' && process.env.S3_BUCKET) {
            const region = process.env.S3_REGION || process.env.AWS_REGION;
            return `https://${process.env.S3_BUCKET}.s3.${region}.amazonaws.com/${chemin}`;
        }
        return `${process.env.API_URL}/${chemin}`;
    },

    getFileSizeInMB: (taille) => {
        return (taille / (1024 * 1024)).toFixed(2);
    }
};

module.exports = Fichier;
