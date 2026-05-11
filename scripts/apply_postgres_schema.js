const fs = require('fs');
const path = require('path');

if (!process.argv[2]) {
  console.error('Usage: node apply_postgres_schema.js "<DATABASE_URL>"');
  process.exit(2);
}

process.env.DATABASE_URL = process.argv[2];

const sequelize = require('../backend/src/config/database');

async function run() {
  try {
    const sqlPath = path.join(__dirname, '..', 'database', 'init_postgres.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolon followed by newline to get statements; simple but works for our file
    const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);

    console.log('Running', statements.length, 'statements...');
    for (const stmt of statements) {
      try {
        console.log('Executing statement snippet:', stmt.slice(0, 80).replace(/\n/g, ' '), '...');
        await sequelize.query(stmt);
      } catch (e) {
        console.error('Statement failed:', e.message);
        throw e;
      }
    }

    console.log('Schema applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error applying schema:', err.message);
    process.exit(1);
  }
}

run();
