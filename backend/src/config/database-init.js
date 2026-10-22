/**
 * Bootstrap PostgreSQL idempotent au démarrage.
 * Les CREATE TABLE/INDEX IF NOT EXISTS préservent les tables déjà présentes.
 */
const fs = require('fs');
const path = require('path');
const sequelize = require('./database');

const initializeDatabase = async () => {
  const databaseRoot = path.resolve(__dirname, '../../database');
  const schemaFiles = [
    path.join(databaseRoot, 'init_postgres.sql'),
    path.join(databaseRoot, 'migrations/013_create_missing_site_config_table.sql')
  ];

  for (const file of schemaFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Fichier de schéma PostgreSQL introuvable: ${path.basename(file)}`);
    }
    const sql = fs.readFileSync(file, 'utf8');
    await sequelize.query(sql);
    console.log(`✅ Schéma PostgreSQL appliqué: ${path.basename(file)}`);
  }

  await sequelize.query(
    `ALTER TABLE signal_moi.fichiers
       ADD COLUMN IF NOT EXISTS campagne_id UUID`
  );
  await sequelize.query(
    `ALTER TABLE signal_moi.fichiers
       ALTER COLUMN signalement_id DROP NOT NULL`
  );
  await sequelize.query(
    `CREATE INDEX IF NOT EXISTS idx_fichiers_campagne
       ON signal_moi.fichiers(campagne_id)`
  );
  await provisionInitialAdmin();
};


/**
 * Création initiale facultative d'un compte administrateur.
 * Activer uniquement avec INITIAL_ADMIN_EMAIL et INITIAL_ADMIN_PASSWORD dans Render,
 * puis retirer ces deux variables après le premier déploiement réussi.
 */
const provisionInitialAdmin = async () => {
  const email = String(process.env.INITIAL_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD || '';
  if (!email && !password) return;
  if (!email || !password) {
    throw new Error('INITIAL_ADMIN_EMAIL et INITIAL_ADMIN_PASSWORD doivent être définis ensemble.');
  }
  if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\\d/.test(password)) {
    throw new Error('Le mot de passe initial admin ne respecte pas la politique de sécurité.');
  }

  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(password, 12);
  await sequelize.query(
    `INSERT INTO signal_moi.users
      (prenom, nom, email, telephone, password, role, is_active, email_verified)
     VALUES ('Administrateur', 'Signal-moi', :email, '', :password, 'admin', true, true)
     ON CONFLICT (email) DO UPDATE SET
       password = EXCLUDED.password,
       role = 'admin',
       is_active = true,
       email_verified = true,
       updated_at = NOW()`,
    { replacements: { email, password: hashedPassword } }
  );
  console.log('✅ Compte administrateur initial créé ou actualisé.');
};

module.exports = { initializeDatabase };
