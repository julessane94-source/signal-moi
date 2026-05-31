// Vérifier la présence et le nombre de lignes dans la table signatures_plaidoyers_anonymes
const db = require('../backend/src/config/database');

(async () => {
  try {
    const res = await db.query('SELECT COUNT(*) AS cnt FROM signal_moi.signatures_plaidoyers_anonymes');
    console.log('Résultat:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Erreur vérification table:', err.message || err);
    process.exit(2);
  }
})();
