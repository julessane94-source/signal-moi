const db = require('../src/config/database');

(async () => {
  try {
    const userId = process.argv[2] || 'bb940053-0488-4c70-a00d-ad227cf521d7';
    const res = await db.query('SELECT id, type, titre, message, created_at FROM signal_moi.notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10', [userId]);
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('check notifications error', err.message || err);
    process.exit(1);
  }
})();
