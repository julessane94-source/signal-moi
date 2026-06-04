#!/usr/bin/env node

const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const DEFAULT_EMAIL = process.env.COLLABORATOR_EMAIL || 'collab@test.com';
const DEFAULT_PASSWORD = process.env.COLLABORATOR_PASSWORD || 'Collab@1234!';
const DEFAULT_PRENOM = process.env.COLLABORATOR_PRENOM || 'Test';
const DEFAULT_NOM = process.env.COLLABORATOR_NOM || 'Collaborateur';
const DEFAULT_TELEPHONE = process.env.COLLABORATOR_TELEPHONE || '0000000000';
const DEFAULT_VILLE = process.env.COLLABORATOR_VILLE || 'Yaoundé';
const DEFAULT_QUARTIER = process.env.COLLABORATOR_QUARTIER || 'Centre';

async function main() {
  const databaseUrl = process.env.DATABASE_URL || process.argv[2];

  if (!databaseUrl) {
    console.error('DATABASE_URL manquante. Utilisation : node scripts/rebuild-collaborator-account.js <DATABASE_URL>');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });

  try {
    await pool.query('SELECT 1');

    const targetTable = await detectUsersTable(pool);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const query = `
      INSERT INTO ${targetTable} (prenom, nom, email, telephone, password, ville, quartier, role, is_active, email_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'collaborateur', true, true, NOW(), NOW())
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
      RETURNING id, email, role;
    `;

    const result = await pool.query(query, [
      DEFAULT_PRENOM,
      DEFAULT_NOM,
      DEFAULT_EMAIL,
      DEFAULT_TELEPHONE,
      hashedPassword,
      DEFAULT_VILLE,
      DEFAULT_QUARTIER
    ]);

    const user = result.rows[0];
    console.log(`✅ Compte collaborateur reconstruit sur ${targetTable}:`);
    console.log(`   id: ${user.id}`);
    console.log(`   email: ${user.email}`);
    console.log(`   role: ${user.role}`);
    console.log(`   mot de passe: ${DEFAULT_PASSWORD}`);
  } catch (error) {
    console.error('❌ Échec de reconstruction du compte collaborateur:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

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

  throw new Error('Aucune table users disponible dans la base de données');
}

main();
