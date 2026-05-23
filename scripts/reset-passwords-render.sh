#!/bin/bash
# Script pour réinitialiser les mots de passe dans PostgreSQL Render

DATABASE_URL="postgresql://signal_moi_db_bqhw_user:YOwlsgv09ScniveqtI0ostBM7mHZmaKb@dpg-d80gj4vaqgkc73a3tq2g-a.frankfurt-postgres.render.com/signal_moi_db_bqhw"

echo "🔐 Réinitialisation des mots de passe en cours..."

# Script Node.js pour hasher et mettre à jour
node << 'NODEEOF'
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const databaseUrl = "postgresql://signal_moi_db_bqhw_user:YOwlsgv09ScniveqtI0ostBM7mHZmaKb@dpg-d80gj4vaqgkc73a3tq2g-a.frankfurt-postgres.render.com/signal_moi_db_bqhw";

async function resetPasswords() {
    const client = new Client({
        connectionString: databaseUrl,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connecté à la base de données PostgreSQL');

        // Récupérer tous les utilisateurs
        const result = await client.query('SELECT id, password, email FROM users');
        const users = result.rows;

        console.log(`📊 ${users.length} utilisateurs trouvés\n`);

        let updated = 0;
        let skipped = 0;

        for (const user of users) {
            // Vérifier si le mot de passe est déjà hashé (commence par $2a$ ou $2b$)
            if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
                skipped++;
                console.log(`⏭️  ${user.email} - Déjà hashé`);
                continue;
            }

            // Hasher le mot de passe avec bcrypt
            const plainPassword = user.password || 'Default123!';
            const hashedPassword = await bcrypt.hash(plainPassword, 10);
            
            // Mettre à jour l'utilisateur
            await client.query(
                'UPDATE users SET password = $1 WHERE id = $2',
                [hashedPassword, user.id]
            );
            updated++;
            console.log(`✅ ${user.email} - Mot de passe hashé avec bcrypt`);
        }

        console.log(`\n✨ Résumé:`);
        console.log(`   ✅ Mis à jour: ${updated}`);
        console.log(`   ⏭️  Déjà hashés: ${skipped}`);
        console.log(`\n🎉 Tous les mots de passe ont été réinitialisés avec bcrypt!`);

        await client.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

resetPasswords();
NODEEOF
