# Corrections - Erreurs de Création de Campagne et Signalement

## 🔧 Problèmes Identifiés et Corrigés

### 1. **Route POST /api/campagnes** (campagne.routes.js)
**Problème**: La route prenait `created_by` du `req.body` au lieu de l'utilisateur connecté.
- Si le client n'envoyait pas `created_by`, la valeur était `undefined`
- Cela causait une erreur SQL: `null` n'est pas accepté pour la colonne `created_by`

**Fix**:
```javascript
// ❌ AVANT
const { titre, description, type, date_debut, date_fin, lieu, capacite_max, created_by } = req.body;
// created_by était undefined si pas envoyé par le client

// ✅ APRÈS  
const { titre, description, type, date_debut, date_fin, lieu, capacite_max } = req.body;
const created_by = req.user.id; // Utiliser l'utilisateur connecté
```

### 2. **Validation des Champs** (campagne.routes.js)
**Ajout**: Validation des champs obligatoires avant la requête SQL
- Titres, descriptions, types, dates et lieux doivent être fournis
- Renvoie 400 Bad Request avec détails avant tentative SQL

### 3. **Route POST /api/collaborator/campaigns** (collaborator.routes.js)
**Améliorations**:
- Meilleure gestion des valeurs par défaut (empty string vs null)
- Gestion sécurisée de la suppression du fichier uploadé en cas d'erreur
- Logs améliorés pour debugging
- Retour de `created_at` pour confirmation
- Meilleur message d'erreur dans la réponse

### 4. **Route POST /api/signalements** (signalement.routes.js)
**Status**: ✅ Déjà correct
- Utilise correctement `req.user.id`
- Validation des champs obligatoires en place
- Gestion correcte des fichiers uploadés

## 📋 Champs Obligatoires par Route

### POST /api/campagnes
```json
{
  "titre": "string (requis)",
  "description": "string (requis)",
  "type": "string (requis)",
  "date_debut": "YYYY-MM-DD (requis)",
  "date_fin": "YYYY-MM-DD (requis)",
  "lieu": "string (requis)",
  "capacite_max": "number (optionnel, défaut: 100)"
}
```

### POST /api/collaborator/campaigns
```json
{
  "titre": "string (requis)",
  "type": "string (requis)",
  "description": "string (optionnel)",
  "dateDebut": "YYYY-MM-DD (optionnel)",
  "dateFin": "YYYY-MM-DD (optionnel)",
  "lieu": "string (optionnel)",
  "capaciteMax": "number (optionnel, défaut: 100)",
  "image": "file (optionnel, form-data)"
}
```

### POST /api/signalements
```json
{
  "titre": "string (requis)",
  "description": "string (requis)",
  "type": "string (requis)",
  "localisation": "string (requis)",
  "latitude": "number (optionnel)",
  "longitude": "number (optionnel)",
  "fichiers": "files (optionnel, max 5)"
}
```

## 🧪 Test des Routes

Utilisez le script `test-create-resources.ps1` pour tester:
```powershell
.\test-create-resources.ps1
```

## 📝 Remarques Importantes

1. **Authentification**: Toutes les routes POST nécessitent un token JWT valide dans le header `Authorization: Bearer <token>`
2. **created_by**: Généré automatiquement depuis l'utilisateur connecté (jamais du body)
3. **Error Handling**: Les erreurs SQL retournent des détails pour debugging
4. **Fichiers**: Les fichiers uploadés sont supprimés automatiquement en cas d'erreur de validation

## 🚀 Déploiement

Après ces corrections:
1. Redémarrer le backend: `npm run dev`
2. Tester les routes avec le script de test
3. Committer et pousser vers GitHub
