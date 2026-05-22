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
        const obj = {};
        for (const r of res.rows) {
            let val = r.valeur;
            // essayer de parser JSON si applicable
            if (typeof val === 'string') {
                try {
                    const parsed = JSON.parse(val);
                    val = parsed;
                } catch (e) {
                    // pas JSON — garder la chaîne
                }
            }
            obj[r.cle] = val;
        }
        return obj;
    }
};

module.exports = SiteConfig;