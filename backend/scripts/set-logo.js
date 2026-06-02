const { Client } = require('pg');

const url = 'postgresql://signal_moi_db_bqhw_user:YOwlsgv09ScniveqtI0ostBM7mHZmaKb@dpg-d80gj4vaqgkc73a3tq2g-a.frankfurt-postgres.render.com/signal_moi_db_bqhw';
const value = '/uploads/IMG-20221117-WA0001.jpg';

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    await client.connect();
    await client.query(
      'INSERT INTO site_config(cle, valeur) VALUES ($1, $2) ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur',
      ['logoUrl', value]
    );
    await client.query(
      'INSERT INTO site_config(cle, valeur) VALUES ($1, $2) ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur',
      ['logo_url', value]
    );
    console.log('UPDATED_OK', value);
  } catch (err) {
    console.error('UPDATE_ERR', err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
