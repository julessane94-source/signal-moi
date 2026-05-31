const db = require('../backend/src/config/database');

(async () => {
  try {
    const res = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'signal_moi' AND table_name = 'fichiers'
      ORDER BY ordinal_position
    `);
    console.log('Columns for signal_moi.fichiers:');
    res.rows.forEach(r => console.log(r.column_name, r.data_type));
    process.exit(0);
  } catch (err) {
    console.error('Erreur describe fichiers:', err.message || err);
    process.exit(2);
  }
})();
