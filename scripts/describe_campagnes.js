const db = require('../backend/src/config/database');

(async () => {
  try {
    const res = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'signal_moi' AND table_name = 'campagnes'
      ORDER BY ordinal_position
    `);
    console.log('Columns for signal_moi.campagnes:');
    res.rows.forEach(r => console.log(r.column_name, r.data_type));
    process.exit(0);
  } catch (err) {
    console.error('Erreur describe campagnes:', err.message || err);
    process.exit(2);
  }
})();
