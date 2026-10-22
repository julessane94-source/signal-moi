#!/usr/bin/env node
/**
 * Bootstrap PostgreSQL non destructif.
 * Ne lance pas les anciennes migrations MySQL ni un sync Sequelize avec alter:true.
 * Le serveur applique ces mêmes scripts idempotents au démarrage.
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('La variable DATABASE_URL est obligatoire.');
  process.exit(2);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined
});

async function main() {
  const root = path.join(__dirname, '..', 'database');
  const files = [
    path.join(root, 'init_postgres.sql'),
    path.join(root, 'migrations', '013_create_missing_site_config_table.sql')
  ];

  const client = await pool.connect();
  try {
    for (const file of files) {
      if (!fs.existsSync(file)) {
        throw new Error(`Fichier SQL introuvable: ${path.basename(file)}`);
      }
      await client.query(fs.readFileSync(file, 'utf8'));
      console.log(`Schéma appliqué: ${path.basename(file)}`);
    }
    await client.query(`ALTER TABLE signal_moi.fichiers ADD COLUMN IF NOT EXISTS campagne_id UUID`);
    await client.query(`ALTER TABLE signal_moi.fichiers ALTER COLUMN signalement_id DROP NOT NULL`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_fichiers_campagne ON signal_moi.fichiers(campagne_id)`);
    console.log('Bootstrap PostgreSQL terminé.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error('Échec du bootstrap PostgreSQL:', error.message);
  process.exit(1);
});
