const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
    },
    logging: false
});

const query = async (sql, params = []) => {
    try {
        const [results] = await sequelize.query(sql, {
            bind: params,
            type: Sequelize.QueryTypes.SELECT
        });
        return results;
    } catch (error) {
        console.error('[DB] Erreur SQL:', error.message);
        throw error;
    }
};

module.exports = { query, sequelize };