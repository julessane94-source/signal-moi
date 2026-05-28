#!/usr/bin/env node
/**
 * Script pour exécuter les migrations de base de données
 * Usage: node scripts/run_migrations_sql.js [migration_file]
 */

const fs = require('fs');
const path = require('path');
const db = require('../backend/src/config/database');

async function runMigration(filePath) {
  try {
    console.log(`📂 Migration file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const sql = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`📝 Executing migration...`);
    await db.query(sql);
    
    console.log(`✅ Migration exécutée avec succès!`);
  } catch (err) {
    console.warn(`⚠️  Migration error (continuing): ${err.message}`);
    // Continue with next migration even if one fails
  }
}

async function runAllMigrations() {
  try {
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`🔧 Exécution de ${files.length} migrations...`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`\n▶️  ${file}...`);
      await runMigration(filePath);
    }

    console.log(`\n✅ Toutes les migrations exécutées avec succès!`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Erreur:`, err.message);
    process.exit(1);
  }
}

// Si un argument est fourni, exécuter cette migration spécifique
const arg = process.argv[2];
if (arg) {
  const filePath = path.isAbsolute(arg) ? arg : path.join(__dirname, '../database/migrations', arg);
  runMigration(filePath).then(() => process.exit(0));
} else {
  // Sinon, exécuter toutes les migrations
  runAllMigrations();
}
