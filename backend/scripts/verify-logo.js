const { Client } = require('pg');

const url = 'postgresql://signal_moi_db_bqhw_user:YOwlsgv09ScniveqtI0ostBM7mHZmaKb@dpg-d80gj4vaqgkc73a3tq2g-a.frankfurt-postgres.render.com/signal_moi_db_bqhw';

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    await client.connect();
    const res = await client.query('select cle, valeur from site_config where cle = $1', ['logoUrl']);
    console.log('LOGO_RESULT=' + JSON.stringify(res.rows));
  } catch (err) {
    console.error('QUERY_ERR', err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
