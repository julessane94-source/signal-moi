const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
    },
    logging: false
});

// Méthode query qui supporte les paramètres $1, $2, etc.
const query = async (sql, params = []) => {
    try {
        // sequelize.query attend un tableau de valeurs pour les replacements au format $1, $2...
        const [results] = await sequelize.query(sql, {
            bind: params,          // important : utilise "bind" pour PostgreSQL
            type: Sequelize.QueryTypes.SELECT
        });
        return results;
    } catch (error) {
        console.error('[DB] Erreur SQL:', error.message);
        throw error;
    }
};

module.exports = { query, sequelize };