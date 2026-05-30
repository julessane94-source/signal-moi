const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://signal_moi_db_bqhw_user:YOwlsgv09ScniveqtI0ostBM7mHZmaKb@dpg-d80gj4vaqgkc73a3tq2g-a.frankfurt-postgres.render.com/signal_moi_db_bqhw',
    ssl: { rejectUnauthorized: false }
});

pool.query('SELECT id, email, role FROM users WHERE email = $1', ['collab@test.com'], (err, res) => {
    if(err) {
        console.error('Error:', err.message);
    } else {
        console.log('Result:', JSON.stringify(res.rows, null, 2));
    }
    pool.end();
});
