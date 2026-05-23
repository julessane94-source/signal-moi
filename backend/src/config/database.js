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

// Wrapper universel pour toutes les requêtes SQL
const query = async (sql, params = []) => {
    try {
        // Déterminer le type de requête
        const sqlTrimmed = sql.trim().toUpperCase();
        let queryType = QueryTypes.SELECT;

        if (sqlTrimmed.startsWith('INSERT')) {
            queryType = QueryTypes.INSERT;
        } else if (sqlTrimmed.startsWith('UPDATE')) {
            queryType = QueryTypes.UPDATE;
        } else if (sqlTrimmed.startsWith('DELETE')) {
            queryType = QueryTypes.DELETE;
        }

        // Exécuter la requête avec les paramètres correctement bindés
        const results = await originalQuery(sql, {
            bind: params,
            type: queryType,
            raw: true
        });

        // Retourner les résultats dans un format cohérent
        // Pour INSERT/UPDATE/DELETE avec RETURNING, results contient les lignes
        // Pour SELECT, results contient les lignes
        return {
            rows: Array.isArray(results) ? results : (results ? [results] : [])
        };
    } catch (error) {
        console.error('[DB] Erreur SQL:', error.message);
        console.error('[DB] SQL:', sql);
        console.error('[DB] Paramètres:', params);
        throw error;
    }
};

// Attacher la fonction à l'instance sequelize
sequelize.query = query;

module.exports = sequelize;
