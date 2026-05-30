const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://signal_moi_db_bqhw_user:YOwlsgv09ScniveqtI0ostBM7mHZmaKb@dpg-d80gj4vaqgkc73a3tq2g-a.frankfurt-postgres.render.com/signal_moi_db_bqhw',
    ssl: { rejectUnauthorized: false }
});

pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users'
    ORDER BY ordinal_position
`, (err, res) => {
    if(err) {
        console.error('Error:', err.message);
    } else {
        console.log('Users table schema:');
        res.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type}`);
        });
    }
    pool.end();
});
