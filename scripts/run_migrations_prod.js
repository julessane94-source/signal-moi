#!/usr/bin/env node
/**
 * Script pour exécuter toutes les migrations avec une DATABASE_URL spécifiée
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://signal_moi_db_bqhw_user:YOwlsgv09ScniveqtI0ostBM7mHZmaKb@dpg-d80gj4vaqgkc73a3tq2g-a.frankfurt-postgres.render.com/signal_moi_db_bqhw';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runAllMigrations() {
  const client = await pool.connect();
  try {
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`🔧 Exécution de ${files.length} migrations...`);
    console.log(`📡 Base: ${DATABASE_URL.split('@')[1]}`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`\n▶️  ${file}...`);
      
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      try {
        await client.query(sql);
        console.log(`✅ ${file} exécutée`);
      } catch (err) {
        console.error(`❌ Erreur dans ${file}:`, err.message);
        throw err;
      }
    }

    console.log(`\n✅ Toutes les migrations exécutées avec succès!`);
  } finally {
    await client.release();
    await pool.end();
  }
}

runAllMigrations().catch(err => {
  console.error(`\n❌ Erreur:`, err.message);
  process.exit(1);
});
