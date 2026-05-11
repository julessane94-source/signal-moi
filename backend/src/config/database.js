const { Sequelize, QueryTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false
});

// Préserver la méthode query originale de Sequelize pour éviter récursion
const originalQuery = sequelize.query.bind(sequelize);

// Wrapper de compatibilité: db.query(...) retourne { rows }
const query = async (sql, params = []) => {
    try {
        const results = await originalQuery(sql, {
            bind: params,
            type: QueryTypes.SELECT
        });
        return { rows: results };
    } catch (error) {
        console.error('[DB] Erreur SQL:', error.message);
        throw error;
    }
};

// Attacher la fonction de compatibilité à l'instance sequelize sous un nom non intrusif
sequelize.queryRaw = query;
// Fournir un alias `query` utilisé par le code qui attend { rows } tout en gardant `originalQuery` accessible
sequelize.query = query;

module.exports = sequelize;