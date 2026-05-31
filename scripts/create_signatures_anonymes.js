// Script pour créer la table signatures_plaidoyers_anonymes si elle manque
// Usage (PowerShell):
// $env:DATABASE_URL='postgresql://...'; $env:DATABASE_SSL='true'; node scripts/create_signatures_anonymes.js

const db = require('../backend/src/config/database');

(async () => {
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS signal_moi.signatures_plaidoyers_anonymes (
        id UUID PRIMARY KEY,
        plaidoyer_id UUID REFERENCES signal_moi.plaidoyers(id) ON DELETE CASCADE,
        nom TEXT,
        email TEXT,
        date_signature TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_spa_plaidoyer ON signal_moi.signatures_plaidoyers_anonymes(plaidoyer_id);
    `;

    console.log('Exécution de la création de table...');
    await db.query(sql);
    console.log('Table "signal_moi.signatures_plaidoyers_anonymes" créée ou existante.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors de la création de la table :', err);
    process.exit(1);
  }
})();
