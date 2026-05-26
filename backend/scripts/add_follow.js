const db = require('../src/config/database');

const userEmail = process.argv[2];
const caseId = process.argv[3];

if (!userEmail || !caseId) {
  console.error('Usage: node add_follow.js <userEmail> <caseId>');
  process.exit(2);
}

(async () => {
  try {
    const userRes = await db.query('SELECT id FROM signal_moi.users WHERE email = $1', [userEmail]);
    if (!userRes.rows || userRes.rows.length === 0) {
      console.error('User not found'); process.exit(3);
    }
    const userId = userRes.rows[0].id;
    const id = require('uuid').v4();
    await db.query('INSERT INTO signal_moi.followed_cases (id, user_id, signalement_id, created_at) VALUES ($1,$2,$3,NOW())', [id, userId, caseId]);
    console.log('follow-added', id);
    process.exit(0);
  } catch (err) {
    console.error('add follow error', err.message || err);
    process.exit(1);
  }
})();
