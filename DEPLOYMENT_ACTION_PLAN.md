# 🚀 PLAN D'ACTION: Redéploiement Signal-Moi

**Status**: 🟢 PRÊT À DÉPLOYER  
**Date**: 2026-05-24  
**Urgence**: 🔴 HAUTE (problèmes de port + authentification)

---

## 🎯 Objectifs

1. ✅ Corriger le port du serveur (5000 → 3000)
2. ✅ Améliorer la logique d'authentification JWT
3. ✅ Ajouter du logging pour les headers Authorization
4. ✅ Configurer JWT_REFRESH_SECRET manquant
5. ✅ Ajouter error handling détaillé

---

## 📝 Changements Effectués

### Fichier 1: `render.yaml`
**Changement**: PORT 5000 → 3000  
**Pourquoi**: Éviter le conflit avec PostgreSQL (5432)

```diff
- - key: PORT
-   value: "5000"
+ - key: PORT
+   value: "3000"
+ - key: JWT_REFRESH_SECRET
+   value: "REPLACE_ME_REFRESH"
```

### Fichier 2: `backend/src/server.js`
**Changements**:
- ✅ Middleware de logging pour Authorization header
- ✅ Endpoints publics (GET /, HEAD /) explicitement définis
- ✅ Amélioration du error handling
- ✅ Binding sur 0.0.0.0 (important pour Docker)
- ✅ Logs détaillés au démarrage

### Fichier 3: `backend/src/middlewares/auth.js`
**Changements**:
- ✅ Vérification explicite du header Authorization
- ✅ Codes d'erreur standardisés (MISSING_AUTH_HEADER, TOKEN_EXPIRED, etc.)
- ✅ Gestion des erreurs JWT détaillée
- ✅ Messages d'erreur informatifs pour le debugging

---

## 🔄 Processus de Déploiement

### Phase 1: Validation Locale (5-10 min)

```bash
# 1. Vérifier les changements
git status

# 2. Exécuter le script de validation
cd scripts
node validate-deployment.js

# 3. Vérifier le log de démarrage local
cd ../backend
npm start
# Vérifier que le log affiche "port 8080" ou "port 3000"
```

### Phase 2: Git Push (2-3 min)

```bash
# 1. Ajouter les fichiers modifiés
git add render.yaml backend/src/server.js backend/src/middlewares/auth.js DEPLOYMENT_DIAGNOSTICS.md

# 2. Commit
git commit -m "fix: correction port Render (5000→3000) et amélioration logging JWT"

# 3. Push vers master
git push origin master
```

### Phase 3: Redéployer sur Render (10-15 min)

1. **Aller sur Render Dashboard**
   - https://dashboard.render.com

2. **Sélectionner le service `signal-moi-backend`**

3. **Configuration des variables d'environnement**
   ```
   PORT = 3000 ✅
   JWT_SECRET = [GÉNÉRER UNE CLÉ SÉCURISÉE]
   JWT_REFRESH_SECRET = [GÉNÉRER UNE CLÉ SÉCURISÉE]
   NODE_ENV = production
   FRONTEND_URL = https://[votre-frontend].vercel.app
   DATABASE_URL = [votre-postgresql-url]
   ```

4. **Cliquer "Manual Deploy"** ou attendre le redéploiement automatique
   - Render détectera les changements et redéploiera automatiquement

5. **Vérifier les logs**
   ```
   ✅ Serveur démarré sur le port 3000
   📡 Frontend URL configurée: https://[...].vercel.app
   ```

---

## ✅ Vérifications Post-Déploiement

### Test 1: Health Check (PUBLIC - pas d'Authorization)
```bash
curl https://signal-moi-api.onrender.com/api/health
# Status: 200 OK ✅
```

### Test 2: Endpoint Racine
```bash
curl https://signal-moi-api.onrender.com/
# Status: 200 OK ✅
# Message: "Service disponible"
```

### Test 3: Sans Authorization (PROTÉGÉ - doit échouer)
```bash
curl https://signal-moi-api.onrender.com/api/admin/users
# Status: 401 UNAUTHORIZED ✅
# Message: "Header Authorization manquant"
```

### Test 4: Avec Authorization (PROTÉGÉ - doit réussir)
```bash
# 1. Se connecter
curl -X POST https://signal-moi-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
# Réponse: { "token": "eyJhbGc..." }

# 2. Utiliser le token
curl https://signal-moi-api.onrender.com/api/admin/users \
  -H "Authorization: Bearer eyJhbGc..."
# Status: 200 OK ✅
```

---

## 🔍 Points à Vérifier après Déploiement

- [ ] Port 3000 utilisé (pas 5432)
- [ ] Header Authorization correctement loggé dans les logs Render
- [ ] GET / et HEAD / retournent 200 OK sans Authorization
- [ ] GET /api/health retourne 200 OK sans Authorization
- [ ] GET /api/admin/users retourne 401 UNAUTHORIZED sans Authorization
- [ ] POST /api/auth/login fonctionne
- [ ] JWT tokens valides acceptés par les routes protégées
- [ ] Tokens expirés retournent 401 avec code TOKEN_EXPIRED

---

## 🆘 Troubleshooting

| Problème | Symptôme | Solution |
|----------|----------|----------|
| Service refuse les connexions | PORT incorrect | Vérifier que PORT=3000 dans Render |
| JWT error | Tokens invalides | Régénérer JWT_SECRET identique entre déploiements |
| 403 Forbidden sans raison | Middleware d'ordre incorrect | Vérifier middleware dans server.js |
| Logs absents | Pas de diagnostique | Activer debug logs dans Render |

---

## 📊 Métriques à Monitorer

Après le déploiement, surveiller:

1. **Uptime**: Service doit rester UP 24/7
2. **Response Time**: < 500ms pour les requêtes
3. **Error Rate**: < 1% pour les 5xx errors
4. **Memory**: < 512MB (starter plan)
5. **CPU**: < 50% (starter plan)

---

## 🚨 Rollback (en cas de problème)

Si le déploiement échoue:

```bash
# Revenir à la version précédente
git revert HEAD
git push origin master

# Ou redéployer une version spécifique sur Render
# Dashboard > Service > Redeploy > Select previous build
```

---

## ✨ Gains Attendus

Après ce déploiement:

- ✅ Plus de conflit de port (5432 vs 5000)
- ✅ Logging détaillé des en-têtes Authorization
- ✅ Messages d'erreur JWT explicites
- ✅ Meilleur debugging en cas de problème
- ✅ Configuration sécurisée pour la production
- ✅ Support des tokens refresh

---

## 📌 Notes Importantes

1. **JWT_SECRET et JWT_REFRESH_SECRET** doivent être des chaînes sécurisées
   - Générer avec: `openssl rand -base64 32`
   - Stocker dans le dashboard Render (pas en git!)

2. **FRONTEND_URL** doit correspondre à votre domaine Vercel
   - Important pour CORS

3. **DATABASE_URL** doit être une URL PostgreSQL valide
   - Format: `postgresql://user:password@host:5432/database`

4. **Vérifier les logs** après déploiement pour confirmer:
   ```
   ✅ Serveur démarré sur le port 3000
   📡 Frontend URL configurée: [...]
   ```

---

**Auteur**: GitHub Copilot  
**Template**: 2026-05-24
