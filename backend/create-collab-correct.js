const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    connectionString: process.argv[2] || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const email = 'collab@test.com';
const password = 'Collab@1234!';

async function detectUsersTable() {
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

async function createCollaborateur() {
    try {
        const usersTable = await detectUsersTable();
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO ${usersTable} (email, password, prenom, nom, role, is_active, telephone, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             ON CONFLICT (email) DO UPDATE SET
               password = EXCLUDED.password,
               prenom = EXCLUDED.prenom,
               nom = EXCLUDED.nom,
               role = EXCLUDED.role,
               is_active = EXCLUDED.is_active,
               telephone = EXCLUDED.telephone,
               updated_at = NOW()
             RETURNING id`,
            [email, hashedPassword, 'Test', 'Collaborateur', 'collaborateur', true, '0000000000']
        );

        console.log('Created/updated collaborateur with id', result.rows[0].id);
        pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        pool.end();
        process.exit(1);
    }
}

createCollaborateur();
