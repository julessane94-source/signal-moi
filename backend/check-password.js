const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://signal_moi_db_bqhw_user:YOwlsgv09ScniveqtI0ostBM7mHZmaKb@dpg-d80gj4vaqgkc73a3tq2g-a.frankfurt-postgres.render.com/signal_moi_db_bqhw',
    ssl: { rejectUnauthorized: false }
});

pool.query('SELECT id, email, password FROM users WHERE email = $1', ['collab@test.com'], (err, res) => {
    if(err) {
        console.error('Error:', err.message);
    } else {
        if(res.rows.length > 0) {
            const user = res.rows[0];
            console.log('User ID:', user.id);
            console.log('Email:', user.email);
            console.log('Password Hash:', user.password);
            console.log('Password Hash Length:', user.password ? user.password.length : 0);
        } else {
            console.log('User not found');
        }
    }
    pool.end();
});
