# 🔍 Diagnostic Complet du Déploiement Signal-Moi

**Date**: 2026-05-24  
**Environnement**: Render.com  
**Branche**: master

---

## 📋 Checklist de Configuration

### ❌ Problèmes Identifiés

#### 1. **PORT CONFLICTUEL** (CRITIQUE)
- **Symptôme**: Render détecte le port 5432 (PostgreSQL) au lieu du port web
- **Cause**: `render.yaml` configurait PORT=5000, mais Render utilise aussi ce port pour d'autres services
- **Solution Appliquée**:
  ```yaml
  # AVANT (❌ INCORRECT)
  PORT: 5000
  
  # APRÈS (✅ CORRECT)
  PORT: 3000
  ```
- **Explication**: Le port 3000 est recommandé pour les web services dans Render et laisse 5432 libre pour PostgreSQL

#### 2. **HEADERS AUTHORIZATION MANQUANTS** (NON-CRITIQUE)
- **Symptôme**: 
  ```
  📨 [2026-05-24T09:01:18.115Z] HEAD /
     Headers: Authorization=❌ Manquant
  📨 [2026-05-24T09:01:21.777Z] GET /
     Headers: Authorization=❌ Manquant
  ```
- **Cause**: Les endpoints `/` et `/api/health` sont publics (health checks)
- **Solution**: Ces requêtes n'ont PAS besoin d'Authorization
- **Vérification**: Routes protégées demandent maintenant Authorization de manière explicite

#### 3. **JWT_REFRESH_SECRET MANQUANT** (DOIT ÊTRE CORRIGÉ)
- **Symptôme**: Les tokens refresh peuvent échouer en production
- **Cause**: Variable d'env manquante dans `render.yaml`
- **Solution Appliquée**:
  ```yaml
  - key: JWT_REFRESH_SECRET
    value: "REPLACE_ME_REFRESH"  # À configurer dans Render Dashboard
  ```

#### 4. **LOGS INSUFFISANTS** (AMÉLIORÉ)
- **Avant**: Pas de logs sur les en-têtes Authorization
- **Après**: Middleware de logging sur TOUTES les requêtes avec status Authorization
  ```javascript
  // Format des logs
  📨 [timestamp] METHOD /path
     Headers: Authorization=✅ Présent | ❌ Manquant
  ```

---

## ✅ Corrections Appliquées

### 1. Configuration Render (`render.yaml`)
```yaml
- Changement du PORT: 5000 → 3000
- Ajout de JWT_REFRESH_SECRET dans envVars
```

### 2. Middleware d'Authentification (`backend/src/middlewares/auth.js`)
```javascript
// Améliorations:
✅ Vérification détaillée du header Authorization
✅ Messages d'erreur explicites avec codes d'erreur
✅ Gestion des erreurs JWT spécifiques (TokenExpiredError, JsonWebTokenError)
✅ Logging des erreurs pour le débogage
```

### 3. Serveur (`backend/src/server.js`)
```javascript
// Améliorations:
✅ Middleware de logging global pour toutes requêtes
✅ Affichage du status Authorization (✅ ou ❌)
✅ Endpoints publics explicites (GET /, HEAD /)
✅ Meilleur error handling
✅ Binding sur 0.0.0.0 (important pour Docker/Render)
✅ Logs de démarrage détaillés
```

---

## 🚀 Étapes de Déploiement

### 1. Mettre à jour Render Dashboard
```bash
# Variables d'environnement à configurer:
NODE_ENV = production
PORT = 3000
JWT_SECRET = [GENÉRER UNE CLÉ SÉCURISÉE]
JWT_REFRESH_SECRET = [GENÉRER UNE CLÉ SÉCURISÉE]
FRONTEND_URL = https://[votre-frontend].vercel.app
DATABASE_URL = [postgresql://user:pass@host/db]
SMTP_HOST = [optionnel]
SMTP_PORT = [optionnel]
SMTP_USER = [optionnel]
SMTP_PASS = [optionnel]
```

### 2. Vérifier le Dockerfile
```bash
# Assurez-vous que backend/Dockerfile expose le bon port:
EXPOSE 3000
```

### 3. Push les changements
```bash
git add render.yaml backend/src/server.js backend/src/middlewares/auth.js
git commit -m "fix: correction port Render et logging authentification"
git push origin master
```

### 4. Redéployer sur Render
- Aller sur le dashboard Render
- Cliquer "Redeploy" sur le service `signal-moi-backend`
- Vérifier les logs pour confirmer le port correct

---

## 🔎 Tests de Diagnostic Post-Déploiement

### Test 1: Health Check (PUBLIC - pas d'Authorization)
```bash
curl https://signal-moi-api.onrender.com/api/health
# Réponse attendue:
# {
#   "status": "OK",
#   "message": "Backend fonctionne",
#   "timestamp": "2026-05-24T09:15:00.000Z",
#   "port": 3000,
#   "environment": "production"
# }
```

### Test 2: Endpoint Racine (PUBLIC)
```bash
curl https://signal-moi-api.onrender.com/
# Réponse attendue:
# {
#   "message": "Service disponible",
#   "status": "running",
#   "version": "1.0.0",
#   "timestamp": "2026-05-24T09:15:00.000Z"
# }
```

### Test 3: Authentification (PROTÉGÉ - avec Authorization)
```bash
# 1. Connexion
curl -X POST https://signal-moi-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
# Réponse: { "success": true, "token": "eyJhbGc...", "user": {...} }

# 2. Utiliser le token
curl https://signal-moi-api.onrender.com/api/admin/users \
  -H "Authorization: Bearer eyJhbGc..."
# Réponse attendue: Tableau des utilisateurs
```

### Test 4: Sans Authorization (ERREUR ATTENDUE)
```bash
curl https://signal-moi-api.onrender.com/api/admin/users
# Réponse attendue:
# {
#   "error": "Header Authorization manquant",
#   "code": "MISSING_AUTH_HEADER"
# }
```

---

## 📊 Vérification des Logs Render

Dans le dashboard Render, les logs devraient ressembler à:

```
2026-05-24 09:15:00 ✅ Serveur démarré sur le port 3000
2026-05-24 09:15:00 📡 Frontend URL configurée: https://[...].vercel.app
2026-05-24 09:15:00 🌍 Environnement: production
2026-05-24 09:15:01 📨 [2026-05-24T09:15:01.000Z] GET /
   Headers: Authorization=❌ Manquant
2026-05-24 09:15:01 📨 [2026-05-24T09:15:01.100Z] GET /api/health
   Headers: Authorization=❌ Manquant
2026-05-24 09:15:02 📨 [2026-05-24T09:15:02.000Z] POST /api/auth/login
   Headers: Authorization=❌ Manquant
```

✅ **NORMAL**: Les endpoints publics n'ont pas d'Authorization  
❌ **PROBLÈME**: Si les protégés (`/api/admin/...`) manquent d'Authorization

---

## 🔐 Sécurité: Checklist Post-Correction

- [ ] JWT_SECRET changé et stocké de manière sécurisée dans Render
- [ ] JWT_REFRESH_SECRET généré et configuré
- [ ] CORS restrict aux domaines autorisés (pas de `*` en production)
- [ ] Password hashing avec bcrypt pour tous les utilisateurs
- [ ] HTTPS enforced sur toutes les routes
- [ ] Logging sans exposition des données sensibles
- [ ] Rate limiting configuré si nécessaire

---

## 📈 Monitoring Continu

Pour un monitoring optimal:

1. **Configurer Application Insights** (optional)
   ```bash
   npm install applicationinsights
   ```

2. **Configurer des alertes Render** pour:
   - Port binding failures
   - High memory usage
   - Frequent crashes

3. **Monitorer les erreurs JWT**:
   - TokenExpiredError
   - JsonWebTokenError
   - MISSING_AUTH_HEADER

---

## 🆘 Troubleshooting

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Port 5432 détecté | DATABASE_URL mal configurée | Vérifier DATABASE_URL dans render.yaml |
| 401 UNAUTHORIZED sur `/api/admin` | Authorization header manquant | Ajouter `Authorization: Bearer <token>` |
| Token invalide | JWT_SECRET ne correspond pas | Régénérer token avec le même secret |
| POST /api/auth/login échoue | Credentials incorrects | Vérifier email/password dans DB |
| CORS error | Origin non autorisée | Ajouter origin dans cors({origin:[...]}) |

---

## 📝 Fichiers Modifiés

1. ✅ `render.yaml` - Port 5000 → 3000, JWT_REFRESH_SECRET ajouté
2. ✅ `backend/src/server.js` - Logging global, erreur handler
3. ✅ `backend/src/middlewares/auth.js` - Messages détaillés, gestion erreurs JWT

---

**Status**: ✅ Prêt pour déploiement  
**Prochaines étapes**: Redéployer sur Render avec les nouvelles configurations
