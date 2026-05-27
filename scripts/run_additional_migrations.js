#!/usr/bin/env node
/**
 * Script pour exécuter les migrations PostgreSQL supplémentaires
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

async function runMigrations() {
  const client = await pool.connect();
  try {
    const migrations = [
      'database/migrations/004_add_followed_cases.sql',
      'database/migrations/005_add_campagnes_inscriptions.sql',
      'database/migrations/006_add_contact_messages.sql'
    ];
    
    for (const file of migrations) {
      console.log(`▶️  ${file}...`);
      const sql = fs.readFileSync(file, 'utf-8');
      await client.query(sql);
      console.log(`✅ OK\n`);
    }
    
    console.log('✅ Toutes les migrations exécutées avec succès!');
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

runMigrations();
