# Résolution : Table site_config manquante

## ⚠️ Problème
L'erreur suivante apparaît lors de la mise à jour du logo :
```
[DB] Erreur SQL: relation "signal_moi.site_config" does not exist
```

## 🔧 Solutions

### Option 1 : Exécuter le correctif SQL directement (RAPIDE)

Si vous avez accès à votre base de données Render :

```bash
psql $DATABASE_URL -f database/fix-site-config-table.sql
```

Ou via l'interface Render :
1. Allez dans les paramètres de la base de données PostgreSQL
2. Cliquez sur "Query Editor" ou "psql"
3. Exécutez le contenu de `database/fix-site-config-table.sql`

### Option 2 : Exécuter les migrations complètes

Pour exécuter toutes les migrations en ordre :

**Sur Linux/Mac:**
```bash
chmod +x run-migrations.sh
./run-migrations.sh
```

**Sur Windows (PowerShell):**
```powershell
.\run-migrations-render.ps1
```

### Option 3 : Exécuter manuellement depuis Node.js

Créez un script Node.js temporaire :
```javascript
const { Sequelize } = require('sequelize');
const fs = require('fs');

async function runMigrations() {
  const sequelize = new Sequelize(process.env.DATABASE_URL);
  
  const migrations = [
    '001_create_tables.sql',
    '002_add_image_to_signalements.sql',
    // ... autres migrations
    '013_create_missing_site_config_table.sql'
  ];
  
  for (const migration of migrations) {
    const sql = fs.readFileSync(`database/migrations/${migration}`, 'utf8');
    try {
      await sequelize.query(sql);
      console.log(`✅ ${migration}`);
    } catch (err) {
      console.log(`⚠️  ${migration} (ignoré)`);
    }
  }
  
  await sequelize.close();
}

runMigrations();
```

## 📋 Contenu de la table créée

La migration crée une table `signal_moi.site_config` avec :
- `cle` (VARCHAR, clé primaire) : Identifiant de la configuration
- `valeur` (TEXT) : Valeur de la configuration
- `logo_data` (BYTEA) : Données binaires du logo
- `logo_filename` (VARCHAR) : Nom du fichier du logo
- `updated_at` (TIMESTAMP) : Date de mise à jour

## ✅ Vérification

Après l'exécution, vérifiez que la table existe :

```sql
SELECT * FROM signal_moi.site_config;
```

Vous devriez voir 6 lignes de configuration.

## 📝 Notes

- Toutes les migrations utilisent `IF NOT EXISTS` pour être idempotentes
- Cette table est nécessaire pour stocker les configurations du site (logo, nom, etc.)
- Les données du logo sont stockées en base pour éviter les pertes lors de redéploiements
