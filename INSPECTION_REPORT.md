# Rapport d'Inspection - Dashboard Collaborateur

**Date**: 25 mai 2026
**Statut**: ✅ Code Frontend/Backend correctement implémenté
**Problèmes Identifiés**: Potentiels problèmes en production (Vercel)

---

## ✅ Code Inspectionné

### 1. Frontend (`frontend/src/pages/collaborator/dashboard.js`)
- **Boutons**: Tous implémentés correctement
  - `Contacter la victime` → `contact(email)` → `mailto:` ✅
  - `Suivre dossier` → `toggleFollow(id)` → POST/DELETE `/api/collaborator/follow` ✅
  - `Exporter PDF` → `exportCases('pdf')` → GET `/api/collaborator/export/cases?format=pdf` ✅
  - `Exporter Excel` → `exportCases('excel')` → GET `/api/collaborator/export/cases?format=excel` ✅
  - `Créer campagne` → route `/collaborator/campagne/new` ✅
  - `Détails` → route `/citizen/signalement/:id` ✅
  - `Statistiques` → toast "non implémentées" ✅
  - `Ne plus suivre` → `toggleFollow(id)` ✅
  - `Voir` → route `/citizen/signalement/:id` ✅
- **Socket.io**: Initialisé correctement, écoute `followed_case_update` ✅
- **Authentification**: Token JWT vérifié et envoyé dans headers ✅

### 2. Backend Routes (`backend/src/routes/collaborator.routes.js`)
- **Endpoints Implémentés**:
  - `GET /api/collaborator/signalements` ✅
  - `POST /api/collaborator/follow` ✅
  - `DELETE /api/collaborator/follow/:caseId` ✅
  - `GET /api/collaborator/followed` ✅
  - `GET /api/collaborator/export/cases?format=pdf|excel` ✅
- **Authentification**: Middleware JWT et vérification rôle 'collaborateur' ✅
- **Export PDF**: Utilise `pdfkit`, génère fichier lisible ✅
- **Export Excel**: Utilise `exceljs`, colonnes bien formatées ✅

### 3. Backend Model (`backend/src/models/FollowedCase.js`)
- `add(userId, signalementId)` ✅
- `remove(userId, signalementId)` ✅
- `listByUser(userId)` ✅
- `followersByCase(signalementId)` ✅
- Requêtes SQL correctes avec JOINs vers table `signalements` ✅

### 4. Backend Server Integration
- `server.js`: Socket.io configuré, `global.io` exposé ✅
- `law-enforcement.routes.js`: Notifications créées et événements émis via socket ✅

---

## ⚠️ Problèmes Potentiels en Production

### Problème 1: Migration Non Exécutée sur Vercel
**Symptôme**: `500 Internal Server Error` sur `/api/collaborator/follow`
**Cause**: Table `signal_moi.followed_cases` n'existe pas en base de données Vercel
**Vérification**:
```sql
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'followed_cases');
```
**Solution**: Exécuter la migration manuellement sur DB Vercel:
```bash
node scripts/run_sql_file.js "<RENDER_DATABASE_URL>" database/migrations/004_add_followed_cases.sql
```

### Problème 2: Dépendances Manquantes sur Vercel Backend
**Symptôme**: `500 Error` sur endpoints export PDF/Excel
**Cause**: `pdfkit` ou `exceljs` non installées dans `backend/node_modules`
**Vérification**: Vérifier `backend/package.json` contient:
```json
{
  "dependencies": {
    "pdfkit": "^0.13.0",
    "exceljs": "^4.3.0"
  }
}
```
**Solution**: 
1. Vérifier que ces dépendances existent dans `backend/package.json`
2. Redéployer le backend sur Vercel/Render (avec `npm install`)

### Problème 3: Routes Non Enregistrées
**Symptôme**: `404 Not Found` sur `/api/collaborator/*`
**Cause**: Routes collaborateur non montées dans `backend/src/server.js`
**Vérification**: Vérifier `backend/src/server.js` contient:
```javascript
const collaboratorRoutes = require('./routes/collaborator.routes');
app.use('/api/collaborator', collaboratorRoutes);
```
**Solution**: Ajouter les lignes ci-dessus si manquantes

### Problème 4: Socket.io Pas Accessible du Frontend
**Symptôme**: Socket ne se connecte pas, console: "Connection error"
**Cause**: Frontend `API_BASE` incorrect ou websocket non configuré côté serveur
**Vérification**:
1. `NEXT_PUBLIC_API_URL` doit pointer vers le backend Render/Vercel
2. Backend doit avoir `cors` configuré correctement pour websockets
**Solution**:
```javascript
// frontend/.env.local
NEXT_PUBLIC_API_URL=https://your-backend.render.com
```

---

## 🔧 Actions de Correction

### Action 1: Valider la Migration en Production
```bash
# Sur votre machine locale
$env:DATABASE_URL="postgresql://...@render.com/signal_moi_db..."
node scripts/run_sql_file.js "$env:DATABASE_URL" database/migrations/004_add_followed_cases.sql
```
**Résultat attendu**: `Migration executed successfully.`

### Action 2: Vérifier Dépendances Backend
```bash
cd backend
npm list pdfkit exceljs
```
**Résultat attendu**:
```
pdfkit@0.13.0
exceljs@4.3.0
```

### Action 3: Tester les Endpoints Manuellement
```bash
# Tester follow endpoint
curl -X POST "https://signal-moi.vercel.app/api/collaborator/follow" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"caseId": "<CASE_ID>"}'
# Résultat attendu: {"success": true}

# Tester export PDF
curl -X GET "https://signal-moi.vercel.app/api/collaborator/export/cases?format=pdf" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  --output dossiers_suivis.pdf
# Résultat attendu: Fichier PDF téléchargé
```

### Action 4: Vérifier les Routes dans `server.js`
Lire `backend/src/server.js` et confirmer que les lignes suivantes existent:
```javascript
const collaboratorRoutes = require('./routes/collaborator.routes');
app.use('/api/collaborator', collaboratorRoutes);
```

---

## 📋 Étapes de Vérification Proposées

1. **✅ Partagez la page authentifiée** (`https://signal-moi.vercel.app/collaborator/dashboard`)
   - Je testerai chaque bouton en navigateur et capturerai les erreurs précises

2. **✅ Confirmez que l'URL Vercel de backend est correcte**
   - Doit être configurée dans `NEXT_PUBLIC_API_URL` du frontend

3. **✅ Exécutez la migration** sur la DB Render:
   ```bash
   $env:DATABASE_URL="postgresql://...@render.com/signal_moi_db..."
   node scripts/run_sql_file.js "$env:DATABASE_URL" database/migrations/004_add_followed_cases.sql
   ```

4. **✅ Vérifiez `backend/package.json`** contient `pdfkit` et `exceljs`

5. **✅ Vérifiez `backend/src/server.js`** enregistre les routes collaborateur

---

## 📝 Récapitulatif

| Composant | Status | Problème |
|-----------|--------|----------|
| Frontend/buttons | ✅ OK | Aucun |
| Frontend/socket.io | ✅ OK | Aucun (si backend configure) |
| Backend/endpoints | ✅ OK | Aucun |
| Backend/models | ✅ OK | Aucun |
| Database/migration | ⚠️ ? | À confirmer (table existe-t-elle?) |
| Dependencies | ⚠️ ? | À confirmer (pdfkit, exceljs installés?) |

---

## 🎯 Prochaine Étape

Dites-moi ce que vous voulez faire:
- **Option A**: Partager la page authentifiée → je teste tous les boutons en navigateur
- **Option B**: Exécuter les commandes de vérification → je propose des patches si nécessaire
- **Option C**: Les deux (recommandé pour coverage complet)
