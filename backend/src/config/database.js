const { Sequelize } = require('sequelize');
require('dotenv').config();

// Utiliser DATABASE_URL si disponible (Render / Supabase), sinon variables individuelles
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
  // Pour développement local — permettre de configurer le dialect via DB_DIALECT
  const dialect = process.env.DB_DIALECT || 'postgres';
  const defaultPort = dialect === 'mysql' || dialect === 'mariadb' ? 3306 : 5432;

  sequelize = new Sequelize(
    process.env.DB_NAME || 'signal_moi_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || defaultPort,
      dialect: dialect,
      logging: false
    }
  );
}

module.exports = sequelize;