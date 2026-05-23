const databaseUrl = process.env.DATABASE_URL;

// Vérifier si on doit exécuter le script
if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL non défini, script de réinitialisation des mots de passe ignoré');
    process.exit(0);
}

let Client, bcrypt;

try {
    ({ Client } = require('pg'));
    bcrypt = require('bcrypt');
} catch (error) {
    console.warn('⚠️  Modules pg ou bcrypt non disponibles, script ignoré');
    console.warn('   (Les dépendances seront installées dans backend/)');
    process.exit(0);
}

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

        console.log(`\n📊 ${users.length} utilisateurs trouvés\n`);

        let updated = 0;
        let skipped = 0;

        for (const user of users) {
            // Vérifier si le mot de passe est déjà hashé
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
        console.log(`\n🎉 Tous les mots de passe ont été réinitialisés avec bcrypt!\n`);

        await client.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

// Exécuter automatiquement
resetPasswords();
