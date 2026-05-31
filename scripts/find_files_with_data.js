const db = require('../backend/src/config/database');

(async () => {
  try {
    const res = await db.query(`
      SELECT id, signalement_id, nom_fichier, chemin, mime_type, taille, file_data IS NOT NULL AS has_data, created_at
      FROM signal_moi.fichiers
      WHERE file_data IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 100
    `);
    console.log('Found', res.rows.length, 'files with file_data');
    res.rows.forEach(r => console.log(r));
    process.exit(0);
  } catch (err) {
    console.error('Erreur find files with data:', err.message || err);
    process.exit(2);
  }
})();