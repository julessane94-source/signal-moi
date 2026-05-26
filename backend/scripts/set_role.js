const db = require('../src/config/database');

const email = process.argv[2];
const role = process.argv[3];

if (!email || !role) {
  console.error('Usage: node set_role.js <email> <role>');
  process.exit(2);
}

(async () => {
  try {
    await db.query('UPDATE signal_moi.users SET role = $1 WHERE email = $2', [role, email]);
    console.log('role-set', email, role);
    process.exit(0);
  } catch (err) {
    console.error('set role error', err.message || err);
    process.exit(1);
  }
})();
