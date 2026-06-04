/**
 * Initialisation automatique de la base de données
 * Exécute les migrations SQL essentielles au démarrage
 */

const fs = require('fs');
const path = require('path');
const sequelize = require('./database');

const initializeDatabase = async () => {
    console.log('🔄 Vérification de l\'intégrité de la base de données...');

    try {
        // Vérifier si la table site_config existe
        const tableExistsResult = await sequelize.query(
            `SELECT EXISTS(
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'signal_moi' 
                AND table_name = 'site_config'
            );`
        );

        const tableExists = Array.isArray(tableExistsResult?.rows)
            ? (tableExistsResult.rows[0]?.[0]?.exists ?? tableExistsResult.rows[0]?.exists ?? false)
            : false;

        if (!tableExists) {
            console.log('⚠️  Table site_config manquante, exécution de la migration 013...');

            // Lire et exécuter la migration
            const migrationPath = path.join(__dirname, '../../database/migrations/013_create_missing_site_config_table.sql');
            const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

            // Diviser en instructions (en séparant par les ;)
            const statements = sqlContent
                .split(';')
                .map(s => s.trim())
                .filter(s => s && !s.startsWith('--') && !s.startsWith('#!/'));

            console.log(`📋 Exécution de ${statements.length} instructions SQL...`);

            // Exécuter chaque instruction
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                try {
                    await sequelize.query(statement);
                    console.log(`   [${i + 1}/${statements.length}] ✅`);
                } catch (err) {
                    // Certaines instructions peuvent échouer si elles sont idempotentes
                    console.log(`   [${i + 1}/${statements.length}] ⚠️  ${err.message.substring(0, 50)}`);
                }
            }

            console.log('✅ Migration 013 exécutée avec succès');
        } else {
            console.log('✅ Table site_config vérifiée');

            // Vérifier qu'il y a des données de base
            const configCountResult = await sequelize.query(
                'SELECT COUNT(*) as count FROM signal_moi.site_config'
            );

            const configCount = Number(
                Array.isArray(configCountResult?.rows)
                    ? (configCountResult.rows[0]?.count ?? configCountResult.rows[0]?.[0]?.count ?? 0)
                    : 0
            );

            if (configCount === 0) {
                console.log('⚠️  Aucune configuration trouvée, initialisation des valeurs par défaut...');
                
                const defaults = [
                    { cle: 'logoUrl', valeur: '/icons/icon-192x192.png' },
                    { cle: 'siteName', valeur: 'Signal-Moi' },
                    { cle: 'siteDescription', valeur: 'Plateforme de signalement civique' },
                    { cle: 'contactEmail', valeur: 'julessane94@gmail.com' },
                    { cle: 'contactPhone', valeur: '+221778851691' },
                    { cle: 'country', valeur: 'SN' }
                ];

                for (const config of defaults) {
                    await sequelize.query(
                        `INSERT INTO signal_moi.site_config (cle, valeur, updated_at) 
                         VALUES (:cle, :valeur, NOW())
                         ON CONFLICT (cle) DO NOTHING`,
                        { replacements: config, raw: true }
                    );
                }

                console.log('✅ Configurations par défaut initialisées');
            }
        }

        console.log('✅ Vérification de la base de données terminée\n');

    } catch (err) {
        console.error('❌ Erreur lors de l\'initialisation de la base de données :');
        console.error(err);
        // Ne pas arrêter l'application, continuer avec avertissement
    }
};

module.exports = { initializeDatabase };
