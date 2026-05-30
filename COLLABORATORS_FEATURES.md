# 🤝 Fonctionnalités Collaborateurs - Signal-Moi

## Résumé des modifications

### 1️⃣ Collaborateurs voient tous les signalements (regroupés avec stats)

**Route**: `GET /api/signalements` (avec token collaborateur)

**Réponse**:
```json
{
  "signalements": [
    {
      "id": "uuid",
      "titre": "Nid de poule rue XXX",
      "description": "...",
      "type": "Infrastructure",
      "statut": "nouveau",
      "localisation": "Paris, 75001",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "author": {
        "id": "uuid",
        "prenom": "Jean",
        "nom": "Dupont",
        "telephone": "+33..."
      },
      "createdAt": "2025-05-28T10:00:00Z",
      "updatedAt": "2025-05-28T10:00:00Z"
    }
  ],
  "stats": {
    "total": 45,
    "byType": {
      "Infrastructure": 12,
      "Violence": 5,
      "Vol": 8,
      "Autre": 20
    },
    "byZone": {
      "Paris, 75001": 15,
      "Paris, 75002": 10,
      "Banlieue": 20
    }
  }
}
```

**Fichier modifié**: `backend/src/routes/signalement.routes.js` (ligne 150-191)

---

### 2️⃣ Collaborateurs créent des plaidoiries

**Route**: `POST /api/plaidoyers`

**Authentification**: ✅ Requise (Bearer token collaborateur ou admin)

**Payload**:
```json
{
  "titre": "Sécurité routière à Paris",
  "description": "Nous demandons une amélioration de la sécurité routière...",
  "categorie": "Sécurité",
  "objectif_signatures": 1500
}
```

**Réponse** (201 Created):
```json
{
  "success": true,
  "message": "Plaidoyer créé avec succès",
  "plaidoyer": {
    "id": "uuid",
    "titre": "Sécurité routière à Paris",
    "description": "...",
    "categorie": "Sécurité",
    "objectif_signatures": 1500,
    "signatures": 0,
    "created_by": "uuid-collaborateur",
    "created_at": "2025-05-28T10:00:00Z",
    "updated_at": "2025-05-28T10:00:00Z"
  }
}
```

**Restrictions**:
- Seuls les **collaborateurs** et **admins** peuvent créer
- Autres rôles recevront: `403 Accès refusé`

**Fichier modifié**: `backend/src/routes/plaidoyer.routes.js` (ligne 45-79)

---

### 3️⃣ Public signe des plaidoiries (sans compte)

**Route**: `POST /api/plaidoyers/{id}/sign`

**Authentification**: ❌ Optionnelle

#### Cas 1: Citoyen authentifié
```bash
curl -X POST http://localhost:3001/api/plaidoyers/uuid/sign \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json"
```

**Réponse**:
```json
{
  "success": true,
  "message": "Plaidoyer signé avec succès",
  "signature": {
    "id": "uuid",
    "plaidoyer_id": "uuid",
    "user_id": "uuid",
    "date_signature": "2025-05-28T10:00:00Z"
  }
}
```

#### Cas 2: Public anonyme (sans compte)
```bash
curl -X POST http://localhost:3001/api/plaidoyers/uuid/sign \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Marie Durand",
    "email": "marie@example.com"
  }'
```

**Réponse** (201):
```json
{
  "success": true,
  "message": "Plaidoyer signé avec succès (anonyme)",
  "signature": {
    "id": "uuid",
    "plaidoyer_id": "uuid",
    "nom": "Marie Durand",
    "email": "marie@example.com",
    "date_signature": "2025-05-28T10:00:00Z"
  }
}
```

**Fichier modifié**: `backend/src/routes/plaidoyer.routes.js` (ligne 103-174)

**Base de données**: Nouvelle table `signal_moi.signatures_plaidoyers_anonymes`

---

## 🗄️ Migrations Requises

**Fichier**: `database/migrations/011_add_collaborators_and_anonymous_signatures.sql`

### Changements:
1. ✅ Ajoute colonne `created_by` à `plaidoyers`
2. ✅ Crée table `signatures_plaidoyers_anonymes`
3. ✅ Ajoute indices pour performance
4. ✅ Ajoute contrainte UNIQUE

**Exécution**:
```bash
# Sur PostgreSQL
psql -U postgres -d signal_moi -f database/migrations/011_add_collaborators_and_anonymous_signatures.sql

# Ou via le backend (si migration auto est configurée)
npm run migrate
```

---

## 🧪 Testing

### Test 1: Collaborateur voit tous les signalements + stats
```bash
# 1. Se connecter en tant que collaborateur
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "collab@example.com", "password": "password"}' \
  | jq -r '.token')

# 2. Récupérer les signalements avec stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/signalements | jq '.stats'

# ✅ Résultat: stats.byType et stats.byZone
```

### Test 2: Collaborateur crée un plaidoyer
```bash
curl -X POST http://localhost:3001/api/plaidoyers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Test Plaidoyer",
    "description": "Description test",
    "categorie": "Test",
    "objectif_signatures": 100
  }' | jq '.plaidoyer.id'
```

### Test 3: Citoyen signe un plaidoyer
```bash
CITIZEN_TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "citizen@example.com", "password": "password"}' \
  | jq -r '.token')

curl -X POST http://localhost:3001/api/plaidoyers/[PLAIDOYER_ID]/sign \
  -H "Authorization: Bearer $CITIZEN_TOKEN" \
  -H "Content-Type: application/json"
```

### Test 4: Public anonyme signe un plaidoyer
```bash
curl -X POST http://localhost:3001/api/plaidoyers/[PLAIDOYER_ID]/sign \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Public Test",
    "email": "public@test.com"
  }'
```

---

## 📋 Checklist de déploiement

- [ ] Migration 011 exécutée en base de données
- [ ] Routes POST /plaidoyers testées (collaborateur + admin)
- [ ] Route POST /plaidoyers/:id/sign testée (auth + anonyme)
- [ ] Route GET /signalements testée (collaborateur avec stats)
- [ ] Vérifier que les citoyens ne voient que leurs signalements
- [ ] Vérifier que la police ne voit que violence/vol
- [ ] Vérifier que l'admin voit tous les signalements
- [ ] Signatures anonymes stockées en base et comptabilisées

---

## 🔐 Notes de sécurité

✅ **Collaborateurs**:
- ✅ Accès protégé par authentification
- ✅ Rôle vérifié au backend
- ✅ Seuls les types `collaborateur` et `admin` peuvent créer

✅ **Signatures publiques**:
- ✅ Email unique par plaidoyer (pas de doublon)
- ✅ Table séparée pour la traçabilité
- ✅ Pas d'accès à des infos sensibles

✅ **Signalements**:
- ✅ Collaborateurs voient TOUS les signalements
- ✅ Citoyens voient seulement les leurs
- ✅ Police voit seulement violence/vol
- ✅ Admin voit tout (modération)
