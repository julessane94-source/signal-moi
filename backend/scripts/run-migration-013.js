#!/usr/bin/env node

/**
 * Script de migration : Crée la table site_config manquante
 * Usage: node backend/scripts/run-migration-013.js
 * 
 * Ce script doit être exécuté avec DATABASE_URL définie :
 * DATABASE_URL="postgres://user:pass@host/db" node backend/scripts/run-migration-013.js
 */

require('dotenv').config({ path: '.env.local' });
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ Erreur : DATABASE_URL n\'est pas définie');
    console.error('Usage: DATABASE_URL="postgres://..." node backend/scripts/run-migration-013.js');
    process.exit(1);
}

console.log('🚀 Exécution de la migration 013...');
console.log('📍 Base de données :', DATABASE_URL.replace(/:[^:]*@/, ':****@'));

const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: (msg) => console.log('   [SQL]', msg),
});

const runMigration = async () => {
    try {
        // Lire le fichier SQL
        const migrationPath = path.join(__dirname, '../../database/migrations/013_create_missing_site_config_table.sql');
        const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

        // Diviser en instructions (en séparant par les ;)
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--') && !s.startsWith('#!/'));

        console.log(`\n📋 Trouvé ${statements.length} instructions SQL\n`);

        // Exécuter chaque instruction
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`[${i + 1}/${statements.length}] Exécution...`);
            
            try {
                const result = await sequelize.query(statement);
                console.log('    ✅ Succès\n');
            } catch (err) {
                console.error('    ❌ Erreur :', err.message);
                // Continuer même si une instruction échoue (peut être une instruction idempotente)
            }
        }

        // Vérifier que la table a été créée
        console.log('\n🔍 Vérification de la table site_config...');
        const tables = await sequelize.query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = 'signal_moi' AND table_name = 'site_config'`
        );

        if (tables[0] && tables[0].length > 0) {
            console.log('✅ Table site_config existe\n');

            // Compter les lignes
            const count = await sequelize.query('SELECT COUNT(*) as count FROM signal_moi.site_config');
            console.log(`📊 Nombre de configurations : ${count[0][0].count}\n`);

            // Afficher les configurations
            const configs = await sequelize.query('SELECT cle, valeur FROM signal_moi.site_config ORDER BY cle');
            console.log('Configurations actuelle:');
            configs[0].forEach(row => {
                console.log(`   - ${row.cle}: ${row.valeur}`);
            });
        } else {
            console.error('❌ La table site_config n\'a pas pu être créée');
            process.exit(1);
        }

        console.log('\n✅ Migration 013 complétée avec succès!');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Erreur lors de la migration :');
        console.error(err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
};

// Gestion des signaux d'interruption
process.on('SIGINT', async () => {
    console.log('\n\n⚠️  Interruption par l\'utilisateur');
    await sequelize.close();
    process.exit(1);
});

runMigration();
