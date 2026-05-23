#!/bin/bash

# Script pour réinitialiser les mots de passe des utilisateurs dans la base de données Render
# À exécuter une seule fois après le déploiement du fix bcrypt

DATABASE_URL="${1:-$DATABASE_URL}"

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erreur: DATABASE_URL non défini"
    echo "Usage: bash reset-passwords.sh [DATABASE_URL]"
    exit 1
fi

echo "🔐 Réinitialisation des mots de passe en cours..."
echo "Cette opération va hasher tous les mots de passe avec bcrypt"

# Script Node.js pour hasher et réinitialiser
cat > /tmp/reset_passwords.js << 'EOF'
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const databaseUrl = process.env.DATABASE_URL;

async function resetPasswords() {
    const client = new Client({
        connectionString: databaseUrl,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connecté à la base de données');

        // Récupérer tous les utilisateurs
        const result = await client.query('SELECT id, password FROM users');
        const users = result.rows;

        console.log(`📊 ${users.length} utilisateurs trouvés`);

        let updated = 0;
        let skipped = 0;

        for (const user of users) {
            // Vérifier si le mot de passe est déjà hashé (commence par $2a$ ou $2b$)
            if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
                skipped++;
                continue;
            }

            // Hasher le mot de passe
            const hashedPassword = await bcrypt.hash(user.password || 'Default123!', 10);
            
            // Mettre à jour l'utilisateur
            await client.query(
                'UPDATE users SET password = $1 WHERE id = $2',
                [hashedPassword, user.id]
            );
            updated++;
            console.log(`✅ Utilisateur ${user.id} mis à jour`);
        }

        console.log(`\n✨ Résumé:`);
        console.log(`   - Mis à jour: ${updated}`);
        console.log(`   - Déjà hashés: ${skipped}`);
        console.log(`✅ Tous les mots de passe ont été réinitialisés avec bcrypt!`);

        await client.end();
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

resetPasswords();
EOF

# Exécuter le script
DATABASE_URL="$DATABASE_URL" node /tmp/reset_passwords.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Les mots de passe ont été réinitialisés avec succès!"
    echo "🔑 Tous les utilisateurs doivent réinitialiser leurs mots de passe"
else
    echo "❌ Erreur lors de la réinitialisation des mots de passe"
    exit 1
fi
