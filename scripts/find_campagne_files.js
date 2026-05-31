const db = require('../backend/src/config/database');

(async () => {
  try {
    const res = await db.query(`
      SELECT id, signalement_id, nom_fichier, chemin, mime_type, taille, file_data IS NOT NULL AS has_data, created_at
      FROM signal_moi.fichiers
      WHERE chemin LIKE '%campagnes%'
      ORDER BY created_at DESC
      LIMIT 50
    `);
    console.log('Found', res.rows.length, 'files with campagnes in chemin');
    res.rows.forEach(r => console.log(r));
    process.exit(0);
  } catch (err) {
    console.error('Erreur find campagne files:', err.message || err);
    process.exit(2);
  }
})();