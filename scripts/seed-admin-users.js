#!/usr/bin/env node
/**
 * Script pour créer les utilisateurs admin et citoyen de test
 * Usage: node scripts/seed-admin-users.js
 */

require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

// Query wrapper
const query = async (sql, params = []) => {
  try {
    const results = await sequelize.query(sql, {
      bind: params,
      type: Sequelize.QueryTypes.SELECT,
      raw: true
    });
    return { rows: Array.isArray(results) ? results : [results] };
  } catch (error) {
    console.error('[DB] Erreur SQL:', error.message);
    console.error('[DB] SQL:', sql);
    console.error('[DB] Paramètres:', params);
    throw error;
  }
};

const createUsers = async () => {
  try {
    console.log('🔄 Vérification de la connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connecté à la base de données');

    // Users à créer
    const usersToCreate = [
      {
        email: 'admin@signal-moi.fr',
        password: 'Admin123!',
        prenom: 'Admin',
        nom: 'Signal-Moi',
        role: 'admin',
        telephone: '0123456789',
        ville: 'Dakar'
      },
      {
        email: 'julessane94@gmail.com',
        password: 'Admin123!',
        prenom: 'Jules',
        nom: 'Sane',
        role: 'citoyen',
        telephone: '770789608',
        ville: 'Thies'
      }
    ];

    for (const user of usersToCreate) {
      console.log(`\n📝 Traitement de ${user.email}...`);

      // Vérifier si l'utilisateur existe déjà
      const checkResult = await query(
        'SELECT id FROM signal_moi.users WHERE email = $1',
        [user.email]
      );

      if (checkResult.rows && checkResult.rows.length > 0) {
        console.log(`⚠️  L'utilisateur ${user.email} existe déjà`);
        continue;
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Insérer l'utilisateur
      const insertResult = await query(
        `INSERT INTO signal_moi.users 
         (prenom, nom, email, password, telephone, ville, quartier, date_naissance, lieu_naissance, role, is_active, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id, email, role`,
        [
          user.prenom,
          user.nom,
          user.email,
          hashedPassword,
          user.telephone,
          user.ville,
          'Centre-Ville',
          '1990-01-01',
          user.ville,
          user.role,
          true, // is_active
          true  // email_verified
        ]
      );

      if (insertResult.rows && insertResult.rows.length > 0) {
        const created = insertResult.rows[0];
        console.log(`✅ Utilisateur créé avec succès:`);
        console.log(`   ID: ${created.id}`);
        console.log(`   Email: ${created.email}`);
        console.log(`   Rôle: ${created.role}`);
        console.log(`   Mot de passe: ${user.password}`);
      }
    }

    console.log('\n✅ Opération terminée !');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
};

createUsers();
