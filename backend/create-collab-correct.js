const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    connectionString: process.argv[2] || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const email = 'collab@test.com';
const password = 'Collab@1234!';

async function createCollaborateur() {
    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert into signal_moi.users
        const result = await pool.query(
            `INSERT INTO signal_moi.users (email, password, prenom, nom, role, is_active, telephone, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             RETURNING id`,
            [email, hashedPassword, 'Test', 'Collaborateur', 'collaborateur', true, '0000000000']
        );
        
        console.log('Created collaborateur with id', result.rows[0].id);
        pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        pool.end();
        process.exit(1);
    }
}

createCollaborateur();
