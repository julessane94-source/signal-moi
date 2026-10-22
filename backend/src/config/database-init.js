/**
 * Bootstrap PostgreSQL idempotent au démarrage.
 * Les CREATE TABLE/INDEX IF NOT EXISTS préservent les tables déjà présentes.
 */
const fs = require('fs');
const path = require('path');
const sequelize = require('./database');

const initializeDatabase = async () => {
  const databaseRoot = path.resolve(__dirname, '../../database');
  const schemaFiles = [
    path.join(databaseRoot, 'init_postgres.sql'),
    path.join(databaseRoot, 'migrations/013_create_missing_site_config_table.sql')
  ];

  for (const file of schemaFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Fichier de schéma PostgreSQL introuvable: ${path.basename(file)}`);
    }
    const sql = fs.readFileSync(file, 'utf8');
    await sequelize.query(sql);
    console.log(`✅ Schéma PostgreSQL appliqué: ${path.basename(file)}`);
  }

  await sequelize.query(
    `ALTER TABLE signal_moi.fichiers
       ADD COLUMN IF NOT EXISTS campagne_id UUID`
  );
  await sequelize.query(
    `ALTER TABLE signal_moi.fichiers
       ALTER COLUMN signalement_id DROP NOT NULL`
  );
  await sequelize.query(
    `CREATE INDEX IF NOT EXISTS idx_fichiers_campagne
       ON signal_moi.fichiers(campagne_id)`
  );
};

module.exports = { initializeDatabase };
