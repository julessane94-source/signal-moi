const db = require('../config/database');

const SiteConfig = {
    get: async (cle) => {
        const res = await db.query('SELECT valeur FROM signal_moi.site_config WHERE cle = $1', [cle]);
        return res.rows[0]?.valeur || null;
    },
    set: async (cle, valeur) => {
        await db.query(
            `INSERT INTO signal_moi.site_config (cle, valeur, updated_at) VALUES ($1, $2, NOW())
             ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, updated_at = NOW()`,
            [cle, valeur]
        );
    },
    getAll: async () => {
        const res = await db.query('SELECT cle, valeur FROM signal_moi.site_config');
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
    },
    // Nouvelles méthodes pour gérer le logo en BD
    setLogoBinary: async (logoBuffer, filename) => {
        await db.query(
            `INSERT INTO signal_moi.site_config (cle, valeur, logo_data, logo_filename, updated_at) 
             VALUES ('logoUrl', '/uploads/logo', $1, $2, NOW())
             ON CONFLICT (cle) DO UPDATE SET logo_data = EXCLUDED.logo_data, 
             logo_filename = EXCLUDED.logo_filename, updated_at = NOW()`,
            [logoBuffer, filename]
        );
    },
    getLogoBinary: async () => {
        const res = await db.query(
            'SELECT logo_data, logo_filename FROM signal_moi.site_config WHERE cle = $1',
            ['logoUrl']
        );
        return res.rows[0] || null;
    }
};

module.exports = SiteConfig;