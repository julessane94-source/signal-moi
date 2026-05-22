#!/usr/bin/env node
/**
 * Script to create a new admin user
 * Usage: node create-admin.js [DATABASE_URL]
 */

const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

// Accept DATABASE_URL as command line argument or from .env
let DATABASE_URL = process.argv[2] || process.env.DATABASE_URL;

// New admin credentials
const adminEmail = 'admin@signal-moi.fr';
const adminPassword = 'Admin@Signal2024!';
const adminPrenom = 'Admin';
const adminNom = 'SignalMoi';
const adminTelephone = '0600000000';
const adminVille = 'Paris';
const adminQuartier = 'Admin';

async function createAdmin() {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not provided!');
    console.error('\nUsage:');
    console.error('  node create-admin.js "postgresql://user:password@host:5432/database"');
    console.error('  OR set DATABASE_URL in .env file');
    console.error('\nExample for local PostgreSQL:');
    console.error('  node create-admin.js "postgresql://postgres:password@localhost:5432/signal_moi_db"');
    process.exit(1);
  }

  const poolConfig = {
    connectionString: DATABASE_URL,
  };

  // Only use SSL in production
  if (process.env.NODE_ENV === 'production') {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  const pool = new Pool(poolConfig);

  try {
    console.log('🔐 Création d\'un nouvel admin...');
    console.log(`📧 Email: ${adminEmail}`);

    // Check if admin already exists
    const checkQuery = 'SELECT id FROM users WHERE email = $1';
    const checkResult = await pool.query(checkQuery, [adminEmail]);

    if (checkResult.rows.length > 0) {
      console.log(`⚠️  Un utilisateur avec cet email existe déjà (ID: ${checkResult.rows[0].id})`);
      console.log('💡 Utilisez un email différent ou supprimez l\'utilisateur existant.');
      process.exit(0);
    }

    // Hash password
    console.log('🔒 Hashage du mot de passe...');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Insert admin
    const insertQuery = `
      INSERT INTO users (prenom, nom, email, telephone, password, ville, quartier, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'admin', true)
      RETURNING id, prenom, nom, email, role, created_at
    `;

    const result = await pool.query(insertQuery, [
      adminPrenom,
      adminNom,
      adminEmail,
      adminTelephone,
      hashedPassword,
      adminVille,
      adminQuartier,
    ]);

    const newAdmin = result.rows[0];

    console.log('\n✅ Admin créé avec succès!');
    console.log('\n📋 Détails du compte:');
    console.log(`   ID: ${newAdmin.id}`);
    console.log(`   Prénom: ${newAdmin.prenom}`);
    console.log(`   Nom: ${newAdmin.nom}`);
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Rôle: ${newAdmin.role}`);
    console.log(`   Créé le: ${newAdmin.created_at}`);

    console.log('\n🔓 Identifiants de connexion:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Mot de passe: ${adminPassword}`);

    console.log('\n⚠️  Importants:');
    console.log('   ✏️  Changez le mot de passe après la première connexion');
    console.log('   🔒 Gardez ces identifiants sécurisés');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la création de l\'admin:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('\n💡 La base de données n\'est pas accessible.');
      console.error('   Vérifiez que:');
      console.error('   1. PostgreSQL est en cours d\'exécution');
      console.error('   2. DATABASE_URL est correctement définie dans .env');
      console.error(`   DATABASE_URL actuelle: ${DATABASE_URL}`);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdmin();
