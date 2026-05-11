const bcrypt = require('bcryptjs');

if (!process.argv[2]) {
  console.error('Usage: node create_admin.js "<DATABASE_URL>"');
  process.exit(2);
}

process.env.DATABASE_URL = process.argv[2];

const db = require('../backend/src/config/database');

async function run() {
  try {
    const email = 'julessane@gmail.com';
    const plain = 'Baye1994@';
    const prenom = 'Jules';
    const nom = 'Sane';
    const telephone = '0000000000';
    const ville = 'Unknown';
    const quartier = 'Unknown';

    // check existing
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows && existing.rows.length > 0) {
      console.log('Admin already exists:', existing.rows[0].id);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(plain, 10);
    const q = `INSERT INTO users (prenom, nom, email, telephone, password, ville, quartier, role) VALUES ($1,$2,$3,$4,$5,$6,$7,'admin') RETURNING id`;
    const r = await db.query(q, [prenom, nom, email, telephone, hashed, ville, quartier]);
    console.log('Admin created with id:', r.rows[0].id);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(1);
  }
}

run();
