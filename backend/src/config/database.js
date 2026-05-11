const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Fonction query qui retourne un objet avec .rows (comme attendu par vos routes)
const query = async (sql, params = []) => {
    const client = await pool.connect();
    try {
        const result = await client.query(sql, params);
        return { rows: result.rows };
    } finally {
        client.release();
    }
};

// Expose aussi le pool pour d'éventuels usages
module.exports = { query, pool };