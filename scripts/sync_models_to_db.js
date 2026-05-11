// Script to sync Sequelize models to a provided Postgres DATABASE_URL
// Usage: node sync_models_to_db.js "postgresql://user:pass@host:5432/db"

if (!process.argv[2]) {
  console.error('Usage: node sync_models_to_db.js <DATABASE_URL>')
  process.exit(2)
}

process.env.DATABASE_URL = process.argv[2]

console.log('Using DATABASE_URL:', process.env.DATABASE_URL.replace(/:(.*)@/, ':*****@'))

;(async () => {
  try {
    // require models which will initialize Sequelize from src/config/database.js
    const models = require('../backend/src/models')
    const { db } = models
    console.log('Connected via Sequelize')

    // create dedicated schema to avoid colliding with existing Supabase tables
    const schema = 'signal_moi'
    console.log(`Ensuring schema '${schema}' exists and setting search_path`) 
    await db.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)
    await db.query(`SET search_path TO "${schema}", public`)

    console.log('Syncing models into schema', schema, '... this may take a moment')

    // Sync models individually into the target schema to avoid altering existing public tables
    const order = ['User','Campagne','Signalement','Fichier','Message','InscriptionCampagne']
    for (const name of order) {
      const model = models[name]
      if (!model) {
        console.log(`Model ${name} not found, skipping.`)
        continue
      }
      // Only sync if this model looks like a Sequelize model (has .schema and .sync)
      if (typeof model.schema === 'function' && typeof model.sync === 'function') {
        console.log(`Syncing model ${name} into schema ${schema}...`)
        try {
          await model.schema(schema).sync({ alter: true })
        } catch (e) {
          console.error(`Sync error for model ${name}:`, e.message)
          try {
            const attrs = model.rawAttributes ? Object.keys(model.rawAttributes) : []
            console.error(`Model ${name} attributes:`, attrs)
            if (model.rawAttributes) {
              for (const a of Object.keys(model.rawAttributes)) {
                const at = model.rawAttributes[a]
                console.error(` - ${a}:`, at && at.type && at.type.key ? at.type.key : String(at && at.type))
              }
            }
          } catch (inner) {
            console.error('Error while dumping attributes:', inner.message)
          }
          throw e
        }
      } else if (typeof model.schema === 'function' && typeof model.schema().sync === 'function') {
        // Some older Sequelize instances may expose sync differently
        console.log(`Syncing model ${name} (alternate path) into schema ${schema}...`)
        try {
          await model.schema(schema).sync({ alter: true })
        } catch (e) {
          console.error(`Sync error for model ${name} (alternate path):`, e.message)
          throw e
        }
      } else {
        console.log(`Model ${name} does not appear to be a Sequelize model, skipping sync.`)
      }
    }
    console.log('Sync complete. Tables should be created/updated in the target database.')
    process.exit(0)
  } catch (err) {
    console.error('Sync error:', err.message)
    console.error(err)
    process.exit(1)
  }
})()
