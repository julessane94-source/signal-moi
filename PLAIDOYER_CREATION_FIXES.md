# 🔧 Corrections - Création de Campagne (Plaidoyers)

## ❌ Bugs trouvés et corrigés

### 1. **Colonne incorrecte pour auteur du plaidoyer**

**Problème** ❌ :
```javascript
// backend/src/routes/plaidoyer.routes.js (avant)
INSERT INTO signal_moi.plaidoyers (id, titre, ..., created_by, ...)
                                             ↑ N'existe pas !
```

La table `plaidoyers` a la colonne `auteur_id` (NOT NULL), pas `created_by`.

**Erreur en base de données**:
```
ERROR: column "created_by" of relation "signal_moi.plaidoyers" does not exist
```

**Solution** ✅ :
```javascript
// ✅ Correction
INSERT INTO signal_moi.plaidoyers (id, titre, description, contenu, categorie, 
                                   objectif_signatures, auteur_id, ...)
VALUES (..., req.user.id)
                    ↑ Correspond à la vraie colonne
```

**Changements**:
- ✅ Utilise `auteur_id` au lieu de `created_by`
- ✅ Ajoute champ `contenu` (obligatoire)
- ✅ Utilise req.user.id pour remplir auteur_id

**Fichier modifié**: [backend/src/routes/plaidoyer.routes.js](backend/src/routes/plaidoyer.routes.js#L66-L71)

---

### 2. **Champ `contenu` manquant (obligatoire)**

**Problème** ❌ :
```javascript
// ❌ AVANT: contenu n'était pas fourni
INSERT INTO plaidoyers (titre, description, categorie, ...)
                        ↑ contenu NOT NULL est obligatoire !
```

La table a `contenu TEXT NOT NULL` (ligne 160 init_postgres.sql).

**Correction** ✅ :
```javascript
// ✅ APRÈS: utilise description comme contenu
const result = await db.query(
  `INSERT INTO signal_moi.plaidoyers 
   (id, titre, description, contenu, categorie, objectif_signatures, auteur_id, ...)
   VALUES ($1, $2, $3, $4, $5, $6, $7, ...)`
  [plaidoyerId, titre, description, description, categorie, objectif, req.user.id]
                                   ↑ Utilise description aussi pour contenu
);
```

---

## 📋 Champs obligatoires pour POST /api/plaidoyers

### Schéma de la base de données
```sql
CREATE TABLE plaidoyers (
  id UUID PRIMARY KEY,
  titre VARCHAR(200) NOT NULL,        -- ✅ Requis
  description TEXT NOT NULL,          -- ✅ Requis
  contenu TEXT NOT NULL,              -- ✅ Requis (OBLIGATOIRE!)
  auteur_id UUID NOT NULL,            -- ✅ Requis (mis à jour auto)
  signatures INTEGER DEFAULT 0,
  objectif_signatures INTEGER,        -- ✅ Optionnel
  categorie VARCHAR(100),             -- ✅ Requis (validé au backend)
  statut VARCHAR(50) DEFAULT 'en_cours',
  date_limite TIMESTAMP,
  image_url VARCHAR(500),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Requête POST correcte

```bash
curl -X POST http://localhost:3001/api/plaidoyers \
  -H "Authorization: Bearer [TOKEN_COLLABORATEUR]" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Sécurité routière à Paris",
    "description": "Nous demandons une amélioration urgente...",
    "categorie": "Sécurité",
    "objectif_signatures": 1500
  }'
```

### Réponse attendue (201 Created)

```json
{
  "success": true,
  "message": "Plaidoyer créé avec succès",
  "plaidoyer": {
    "id": "uuid-1234",
    "titre": "Sécurité routière à Paris",
    "description": "Nous demandons une amélioration urgente...",
    "contenu": "Nous demandons une amélioration urgente...",
    "auteur_id": "uuid-collaborateur",
    "signatures": 0,
    "objectif_signatures": 1500,
    "categorie": "Sécurité",
    "statut": "en_cours",
    "created_at": "2026-05-28T10:00:00Z",
    "updated_at": "2026-05-28T10:00:00Z"
  }
}
```

---

## 🧪 Test POST /api/plaidoyers

### Étapes
1. Authentifiez-vous en tant que collaborateur
   ```bash
   TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "collab@example.com", "password": "password"}' \
     | jq -r '.token')
   ```

2. Créez un plaidoyer
   ```bash
   curl -X POST http://localhost:3001/api/plaidoyers \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "titre": "Test Plaidoyer",
       "description": "Ceci est un test",
       "categorie": "Test",
       "objectif_signatures": 100
     }' | jq '.'
   ```

3. **Résultat attendu**: `201 Created` avec plaidoyer en réponse

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `403 Forbidden` | Utilisateur n'est pas collaborateur | Utiliser token collaborateur |
| `400 Bad Request` | Champs manquants | Vérifier `titre`, `description`, `categorie` |
| `500 Internal Error` | `auteur_id` NOT NULL fail | Vérifier que `auteur_id` est bien rempli |
| `500 contenu ERROR` | `contenu` manquant | ✅ CORRIGÉ - maintenant utilise description |

---

## ✅ Fichiers modifiés

✅ **backend/src/routes/plaidoyer.routes.js** (ligne 66)
- Utilise `auteur_id` au lieu de `created_by`
- Ajoute champ `contenu`

✅ **database/migrations/011_add_collaborators_and_anonymous_signatures.sql**
- Simplifié (supporte juste les signatures anonymes)
- Évite la confusion avec `created_by`

---

## 📞 Test sur l'app (signal-moi.vercel.app)

**Fournir**:
- 📧 Email collaborateur
- 🔐 Mot de passe
- Tester :
  1. Login collaborateur
  2. Créer une campagne
  3. Vérifier que la campagne est sauvegardée
  4. Vérifier que les images de la campagne s'affichent
