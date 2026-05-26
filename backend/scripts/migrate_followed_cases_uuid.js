const pg = require('pg');

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://signal_moi_db_bqhw_user:YOwlsgv09ScniveqtI0ostBM7mHZmaKb@dpg-d80gj4vaqgkc73a3tq2g-a.frankfurt-postgres.render.com/signal_moi_db_bqhw',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await client.connect();
    console.log('🔄 Migrating followed_cases table to UUID type...');

    // Drop existing table
    await client.query('DROP TABLE IF EXISTS signal_moi.followed_cases CASCADE;');
    console.log('✅ Dropped existing table');

    // Create new table with UUID
    await client.query(`
      CREATE TABLE signal_moi.followed_cases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        signalement_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Created followed_cases table with UUID columns');

    // Create indexes
    await client.query(`
      CREATE UNIQUE INDEX idx_followed_unique ON signal_moi.followed_cases (user_id, signalement_id);
      CREATE INDEX idx_followed_signalement ON signal_moi.followed_cases (signalement_id);
    `);
    console.log('✅ Created indexes');
    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
