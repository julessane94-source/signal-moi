const db = require('../backend/src/config/database');

(async () => {
  try {
    const res = await db.query(`
      SELECT id, chemin, mime_type, taille, (file_data IS NOT NULL) as has_data, campagne_id, created_at
      FROM signal_moi.fichiers
      WHERE campagne_id IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 20
    `);

    console.log('Found', res.rows.length, 'files linked to campagnes');
    res.rows.forEach(r => console.log(r));
    process.exit(0);
  } catch (err) {
    console.error('Erreur inspect fichiers campagnes:', err.message || err);
    process.exit(2);
  }
})();
