const { Client } = require('pg')

const conn = process.argv[2]
if (!conn) {
  console.error('Usage: node check_db.js <connection_string>')
  process.exit(2)
}

async function run() {
  const client = new Client({ connectionString: conn })
  try {
    await client.connect()
    console.log('Connected to DB')

    // find tables matching signal
    const res = await client.query(`SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') AND table_name ILIKE '%signal%'`)
    if (res.rows.length === 0) {
      console.log('No tables matching "%signal%" found in public schemas.')
    } else {
      console.log('Found tables:')
      for (const r of res.rows) console.log(`- ${r.table_schema}.${r.table_name}`)

      for (const r of res.rows) {
        const full = `${r.table_schema}.${r.table_name}`
        try {
          const c = await client.query(`SELECT COUNT(*) FROM ${r.table_schema}.${r.table_name}`)
          console.log(`\nCOUNT for ${full}:`, c.rows[0].count)
          const samples = await client.query(`SELECT * FROM ${r.table_schema}.${r.table_name} ORDER BY 1 DESC LIMIT 5`)
          console.log(`SAMPLE rows for ${full} (up to 5):`)
          console.dir(samples.rows, { depth: 2, maxArrayLength: 50 })
        } catch (e) {
          console.error(`Error querying ${full}:`, e.message)
        }
      }
    }
    // if none found, list all user tables
    if (res.rows.length === 0) {
      const all = await client.query(`SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema, table_name`)
      console.log('\nAll non-system tables:')
      all.rows.forEach(r => console.log(`- ${r.table_schema}.${r.table_name}`))
    }
  } catch (err) {
    console.error('Connection / query error:', err.message)
  } finally {
    await client.end()
  }
}

run()
