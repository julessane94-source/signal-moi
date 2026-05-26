#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

async function main() {
  const dbUrl = process.argv[2];
  const filePath = process.argv[3];

  if (!dbUrl || !filePath) {
    console.error('Usage: node run_sql_file.js <DATABASE_URL> <sql_file_path>');
    process.exit(2);
  }

  process.env.DATABASE_URL = dbUrl;

  // Require the backend DB wrapper (uses sequelize)
  const dbPath = path.join(__dirname, '..', 'backend', 'src', 'config', 'database');
  const db = require(dbPath);

  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.error('SQL file not found:', fullPath);
    process.exit(3);
  }

  const sql = fs.readFileSync(fullPath, 'utf8');

  try {
    console.log('Executing SQL file:', fullPath);
    await db.query(sql);
    console.log('Migration executed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  }
}

main();
