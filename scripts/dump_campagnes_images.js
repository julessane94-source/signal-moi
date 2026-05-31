const db = require('../backend/src/config/database');

(async () => {
  try {
    const res = await db.query(`SELECT id, titre, image_url, banner_url, image FROM signal_moi.campagnes ORDER BY created_at DESC LIMIT 20`);
    res.rows.forEach(r => console.log(r));
    process.exit(0);
  } catch (err) {
    console.error('Erreur dump campagnes:', err.message || err);
    process.exit(2);
  }
})();
