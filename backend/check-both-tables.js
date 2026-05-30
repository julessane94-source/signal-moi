const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://signal_moi_db_bqhw_user:YOwlsgv09ScniveqtI0ostBM7mHZmaKb@dpg-d80gj4vaqgkc73a3tq2g-a.frankfurt-postgres.render.com/signal_moi_db_bqhw',
    ssl: { rejectUnauthorized: false }
});

console.log('Checking public.users...');
pool.query('SELECT id, email, role FROM public.users WHERE email = $1', ['collab@test.com'], (err, res) => {
    if(err) {
        console.error('Error:', err.message);
    } else {
        console.log('  Found:', res.rows.length, 'user(s)');
    }
    
    console.log('\nChecking signal_moi.users...');
    pool.query('SELECT id, email, role FROM signal_moi.users WHERE email = $1', ['collab@test.com'], (err2, res2) => {
        if(err2) {
            console.error('Error:', err2.message);
        } else {
            console.log('  Found:', res2.rows.length, 'user(s)');
        }
        pool.end();
    });
});
