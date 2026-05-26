const db = require('../src/config/database');

(async () => {
  try {
    await db.query("UPDATE signal_moi.users SET role='police' WHERE email = $1", ['save@gmail.com']);
    console.log('role-updated');
    process.exit(0);
  } catch (err) {
    console.error('promote error', err.message || err);
    process.exit(1);
  }
})();
