# 📊 Migration PostgreSQL - Signal-Moi Production

## ✅ Statut: COMPLÉTÉ

**Date**: 27 mai 2026  
**Base de données**: PostgreSQL Render (Frankfurt)  
**Schéma**: `signal_moi`

---

## 🔄 Migrations Exécutées

### 1️⃣ init_postgres.sql (SCHÉMA DE BASE)
**Status**: ✅ Succès

Crée le schéma complet avec toutes les tables principales:

| Table | Colonnes | Statut |
|-------|----------|--------|
| `users` | 21 colonnes | ✅ Créée |
| `signalements` | 19 colonnes | ✅ Créée |
| `fichiers` | 9 colonnes | ✅ Créée |
| `campagnes` | 14 colonnes | ✅ Créée |
| `plaidoyers` | 9 colonnes | ✅ Créée |

**Points Clés**:
- Utilise UUID pour les clés primaires
- Extension pgcrypto pour gen_random_uuid()
- Timestamps avec timezone
- Indexes créés pour performance

### 2️⃣ 004_add_followed_cases.sql
**Status**: ✅ Succès

```sql
CREATE TABLE signal_moi.followed_cases (
  id UUID PRIMARY KEY,
  user_id UUID,
  signalement_id UUID,
  created_at TIMESTAMP
);
```

**Utilité**: Permet aux citoyens de suivre des signalements

### 3️⃣ 005_add_campagnes_inscriptions.sql
**Status**: ✅ Succès

Crée deux tables:
- `inscriptions_campagnes` - Abonnements aux campagnes
- `signatures_plaidoyers` - Signatures de pétitions

Avec contraintes UNIQUE pour éviter les doublons.

### 4️⃣ 006_add_contact_messages.sql
**Status**: ✅ Succès

```sql
CREATE TABLE signal_moi.contact_messages (
  id UUID PRIMARY KEY,
  nom VARCHAR(255),
  email VARCHAR(255),
  telephone VARCHAR(20),
  sujet VARCHAR(255),
  message TEXT,
  statut VARCHAR(50) DEFAULT 'nouveau',
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  responded_at TIMESTAMP,
  notes TEXT
);
```

**Utilité**: Stocke les messages du formulaire de contact public

---

## ❌ Migrations Ignorées (Obsolètes)

### ❌ 001_create_tables.sql
**Raison**: Syntaxe MySQL (USE, CREATE DATABASE)  
**Solution**: Remplacée par init_postgres.sql (PostgreSQL natif)

### ❌ 002_add_image_to_signalements.sql
**Raison**: Ajoute colonne `images` qui n'existe pas en production  
**Solution**: Les images sont dans la table `fichiers` (séparation des préoccupations)

### ❌ 003_add_citoyenne_type.sql
**Raison**: Syntaxe MySQL (USE, INSERT ... ON CONFLICT)  
**Solution**: Sera ajoutée manuellement si nécessaire

### ❌ 005_add_images_column.sql (Doublon)
**Raison**: Même que 002_add_image_to_signalements.sql  
**Solution**: Ignorée

---

## 🔧 Schéma Créé - Vue d'Ensemble

```
signal_moi (schema)
├── users
│   ├── id (UUID PK)
│   ├── email (UNIQUE)
│   ├── password
│   ├── role (citoyen, collaborateur, admin)
│   ├── created_at
│   └── ...20 autres colonnes
│
├── signalements
│   ├── id (UUID PK)
│   ├── user_id (FK → users)
│   ├── titre
│   ├── description
│   ├── type
│   ├── statut
│   ├── localisation
│   ├── latitude, longitude
│   └── ...autres metadata
│
├── fichiers
│   ├── id (UUID PK)
│   ├── signalement_id (FK → signalements)
│   ├── nom_fichier
│   ├── chemin
│   ├── type (image|video|audio|document)
│   ├── mime_type
│   └── ...metadata
│
├── campagnes
│   ├── id (UUID PK)
│   ├── titre
│   ├── description
│   ├── type
│   ├── date_debut, date_fin
│   ├── created_by (FK → users)
│   └── ...autres
│
├── inscriptions_campagnes
│   ├── campagne_id (FK)
│   ├── user_id (FK)
│   └── UNIQUE(campagne_id, user_id)
│
├── plaidoyers
│   ├── id (UUID PK)
│   ├── titre
│   ├── description
│   └── ...
│
├── signatures_plaidoyers
│   ├── plaidoyer_id (FK)
│   ├── user_id (FK)
│   └── UNIQUE(plaidoyer_id, user_id)
│
├── followed_cases
│   ├── user_id
│   ├── signalement_id
│   └── UNIQUE(user_id, signalement_id)
│
└── contact_messages
    ├── id (UUID PK)
    ├── nom, email, telephone
    ├── sujet, message
    ├── statut (nouveau|en-cours|répondre|fermé)
    └── created_at, responded_at
```

---

## 🚀 Points de Contrôle Importants

### ✅ Images/Preuves de Signalement
- **Structure**: Tableau `fichiers` séparé
- **Pas de colonne** `images` sur `signalements`
- **Affichage**: `GET /api/signalements/:id` retourne `fichiers: [...]`

### ✅ Campagnes & Inscriptions
- **Abonnements**: Deduplicated via UNIQUE constraint
- **Signature pétitions**: Même pattern

### ✅ Contact Public
- **Stockage**: Table `contact_messages`
- **Statuts**: nouveau → en-cours → répondre → fermé
- **Emails**: Tracés via statut et responded_at

### ✅ Authentification & Rôles
- **Colonnes**: `password`, `email_verified`, `two_factor_enabled`
- **Rôles**: citoyen, collaborateur, admin
- **État**: `is_active` pour soft-delete

---

## 📝 Configuration Backend

Vérifiez que les variables d'environnement sont configurées:

```bash
DATABASE_URL=postgresql://signal_moi_db_bqhw_user:YOwlsgv09ScniveqtI0ostBM7mHZmaKb@dpg-d80gj4vaqgkc73a3tq2g-a.frankfurt-postgres.render.com/signal_moi_db_bqhw

# Autres variables requises
JWT_SECRET=votre_secret
API_BASE_URL=https://votre-api.com
SMTP_HOST=votre_smtp
SMTP_PORT=587
SMTP_USER=votre_email
SMTP_PASSWORD=votre_password
```

---

## 🧪 Tests Post-Migration

### 1. Vérifier la Connexion
```bash
npm run dev
# Vérifier que le backend démarre sans erreur
```

### 2. Tester les Routes Principales
```bash
# Créer un signalement
POST /api/signalements
Body: { titre, description, type, localisation }

# Créer une campagne
POST /api/campagnes
Body: { titre, description, type, date_debut, date_fin, lieu }

# Envoyer un message de contact
POST /api/contact/send
Body: { nom, email, sujet, message }
```

### 3. Vérifier les Tables
```sql
-- Depuis psql ou DBeaver
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'signal_moi';
```

---

## 📋 Checklist Déploiement

- [x] Schéma PostgreSQL créé (`init_postgres.sql`)
- [x] Tables supplémentaires ajoutées (migrations 004-006)
- [x] Migrations obsolètes ignorées (001, 002, 003, 005_images)
- [x] Colonnes `images` supprimées du code backend
- [ ] Admin créé dans la base de données
- [ ] Variables d'environnement configurées
- [ ] Backend redémarré avec `npm run dev`
- [ ] Tests fonctionnels validés

---

## 🔗 Références

- **BD Postgres Render**: dpg-d80gj4vaqgkc73a3tq2g-a.frankfurt-postgres.render.com
- **Schéma**: signal_moi
- **Fichiers init**: 
  - database/init_postgres.sql (schéma de base)
  - database/migrations/004-006 (tables supplémentaires)

---

**Créé le**: 27 mai 2026  
**Prêt pour**: Production Render
