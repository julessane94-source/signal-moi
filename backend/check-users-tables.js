const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://signal_moi_db_bqhw_user:YOwlsgv09ScniveqtI0ostBM7mHZmaKb@dpg-d80gj4vaqgkc73a3tq2g-a.frankfurt-postgres.render.com/signal_moi_db_bqhw',
    ssl: { rejectUnauthorized: false }
});

pool.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name = 'users'
    ORDER BY table_schema
`, (err, res) => {
    if(err) {
        console.error('Error:', err.message);
    } else {
        console.log('Users tables found:');
        res.rows.forEach(row => {
            console.log(`  ${row.table_schema}.${row.table_name}`);
        });
    }
    pool.end();
});
