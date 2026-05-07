const { Sequelize } = require('sequelize');
require('dotenv').config();

// Utiliser DATABASE_URL si disponible, sinon les variables individuelles
let sequelize;

if (process.env.DATABASE_URL) {
  // Pour Render avec Supabase
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
} else {
  // Pour développement local
  sequelize = new Sequelize(
    process.env.DB_NAME || 'signal_moi_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging: false
    }
  );
}

module.exports = sequelize;