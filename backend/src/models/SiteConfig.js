const db = require('../config/database');

const SiteConfig = {
    get: async (cle) => {
        const res = await db.query('SELECT valeur FROM site_config WHERE cle = $1', [cle]);
        return res.rows[0]?.valeur || null;
    },
    set: async (cle, valeur) => {
        await db.query(
            `INSERT INTO site_config (cle, valeur, updated_at) VALUES ($1, $2, NOW())
             ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, updated_at = NOW()`,
            [cle, valeur]
        );
    },
    getAll: async () => {
        const res = await db.query('SELECT cle, valeur FROM site_config');
        return Object.fromEntries(res.rows.map(r => [r.cle, r.valeur]));
    }
};

module.exports = SiteConfig;