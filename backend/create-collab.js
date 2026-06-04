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

async function detectUsersTable(pool) {
  const candidates = ['signal_moi.users', 'users'];
  for (const table of candidates) {
    try {
      await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
      return table;
    } catch (error) {
      if (!/does not exist|relation .* does not exist/i.test(error.message)) {
        throw error;
      }
    }
  }
  throw new Error('Aucune table users disponible');
}

async function createCollab() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL missing');
    process.exit(1);
  }

  const poolConfig = { connectionString: DATABASE_URL };
  if (process.env.NODE_ENV === 'production') poolConfig.ssl = { rejectUnauthorized: false };
  const pool = new Pool(poolConfig);

  try {
    const usersTable = await detectUsersTable(pool);
    const hashed = await bcrypt.hash(password, 10);
    const insert = await pool.query(`
      INSERT INTO ${usersTable} (prenom, nom, email, telephone, password, ville, quartier, role, is_active, email_verified, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'collaborateur', true, true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        prenom = EXCLUDED.prenom,
        nom = EXCLUDED.nom,
        telephone = EXCLUDED.telephone,
        password = EXCLUDED.password,
        ville = EXCLUDED.ville,
        quartier = EXCLUDED.quartier,
        role = 'collaborateur',
        is_active = true,
        email_verified = true,
        updated_at = NOW()
      RETURNING id`, [prenom, nom, email, telephone, hashed, ville, quartier]);
    console.log('Created/updated collaborator with id', insert.rows[0].id, 'on', usersTable);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createCollab();
