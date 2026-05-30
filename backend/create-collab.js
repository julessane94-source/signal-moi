#!/usr/bin/env node
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

let DATABASE_URL = process.argv[2] || process.env.DATABASE_URL;

const email = 'collab@test.com';
const password = 'Collab@1234!';
const prenom = 'Collab';
const nom = 'Test';
const telephone = '0600000001';
const ville = 'Paris';
const quartier = 'Test';

async function createCollab() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL missing');
    process.exit(1);
  }

  const poolConfig = { connectionString: DATABASE_URL };
  if (process.env.NODE_ENV === 'production') poolConfig.ssl = { rejectUnauthorized: false };
  const pool = new Pool(poolConfig);

  try {
    const check = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      console.log('User exists:', check.rows[0].id);
      process.exit(0);
    }
    const hashed = await bcrypt.hash(password, 10);
    const insert = await pool.query(`INSERT INTO users (prenom, nom, email, telephone, password, ville, quartier, role, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,'collaborateur', true) RETURNING id`, [prenom, nom, email, telephone, hashed, ville, quartier]);
    console.log('Created collaborator with id', insert.rows[0].id);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createCollab();
