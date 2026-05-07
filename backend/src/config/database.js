const { Sequelize } = require('sequelize');
require('dotenv').config();

// Créer une instance Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'signal_moi_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Tester la connexion
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Base de données connectée');
    return true;
  } catch (error) {
    console.error('❌ Erreur DB:', error.message);
    return false;
  }
};

testConnection();

// Expose Sequelize constructor for compatibility and add a `query` helper
sequelize.Sequelize = Sequelize;

// Compatibility wrapper matching previous db.query(sql, params)
sequelize.query = async function(sql, params = []) {
  try {
    const [results] = await Sequelize.prototype.query.call(this, sql, { replacements: params, type: Sequelize.QueryTypes.SELECT });
    return results;
  } catch (err) {
    // rethrow so callers can log
    throw err;
  }
};

module.exports = sequelize;