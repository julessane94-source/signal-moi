# 🚀 DEPLOYMENT SUMMARY - Signal-Moi Backend

## ✅ Corrections Appliquées

### 1. **Port Configuration** ✅
- **Problème:** Dockerfile exposait port `5000` mais `server.js` utilisait port `8080`
- **Fichier:** `backend/Dockerfile`
- **Correction:** `EXPOSE 8080` (ligne 11)
- **Impact:** Le serveur démarre maintenant sur le bon port

### 2. **JWT Authentication Middleware** ✅
- **Problème:** Syntaxe MySQL (`?`) utilisée au lieu de PostgreSQL (`$1`)
- **Fichier:** `backend/src/middleware/auth.middleware.js`
- **Correction:** 
  ```javascript
  // Avant ❌
  const [users] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
  
  // Après ✅
  const result = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
  const users = result.rows || [];
  ```
- **Impact:** L'authentification JWT fonctionne correctement avec PostgreSQL

### 3. **Documentation & Tests** ✅
- **Nouveau fichier:** `DEPLOYMENT_TROUBLESHOOTING.md`
  - Guide complet de configuration Render
  - Checklist de vérification
  - Debugging des problèmes courants
  
- **Nouveau fichier:** `backend/test-backend.js`
  - Script de test automatisé pour JWT
  - Tests des endpoints protégés
  - Validation du middleware d'authentification

---

## 🎯 Next Steps - Configuration Render

### **Étape 1: Variables d'Environnement**

Allez sur: **Render Dashboard → Your Web Service → Environment**

Configurez ces variables (⚠️ CRITICAL):

```env
DATABASE_URL=postgresql://user:password@your-db-host:5432/signal_moi_db
JWT_SECRET=your-super-long-random-secret-minimum-32-chars-CHANGE-ME
FRONTEND_URL=https://signal-moi.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
NODE_ENV=production
PORT=8080
```

### **Étape 2: Redéployer**

1. Push les changements:
   ```bash
   git add -A
   git commit -m "fix: port configuration, JWT auth middleware, and deployment docs"
   git push origin main
   ```

2. Render redéploiera automatiquement (2-3 minutes)

### **Étape 3: Vérifier les Logs**

Dans **Render Dashboard → Runtime Logs**, cherchez:
```
✅ Serveur démarré sur le port 8080
✅ JWT_SECRET: ✅ Défini
✅ DATABASE_URL: Défini
✅ Backend fonctionne
```

---

## 🧪 Tests

### Localement (avant production):

```bash
# 1. Démarrer le backend
cd backend
npm install
npm run dev

# 2. En autre terminal, lancer les tests
node test-backend.js http://localhost:8080
```

### En Production (Render):

```bash
# Remplacer par votre URL Render
node backend/test-backend.js https://signal-moi-api.onrender.com
```

**Résultat attendu:**
```
✅ 1️⃣ Health check OK
✅ 2️⃣ Inscription réussie
✅ 3️⃣ Connexion réussie
✅ 4️⃣ Endpoint protégé SANS token - Correctement bloqué (401)
✅ 5️⃣ Endpoint protégé AVEC token - Token accepté
✅ 6️⃣ Token INVALIDE - Correctement rejeté (401)
✅ 7️⃣ Token malformé - Correctement rejeté (401)

✅ Tous les tests de sécurité JWT sont passés!
```

---

## 🔍 Vérification du Déploiement

### Test 1: Health Check
```bash
curl https://signal-moi-api.onrender.com/api/health
# Réponse: {"status":"OK","message":"Backend fonctionne","timestamp":"..."}
```

### Test 2: Inscription + Login + Token
```bash
# 1. Inscription
curl -X POST https://signal-moi-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "SecurePassword123",
    "phone": "0612345678",
    "city": "Paris"
  }'

# Réponse: {"success": true, "token": "eyJhbG...", "user": {...}}

# 2. Utiliser le token pour accéder à un endpoint protégé
curl https://signal-moi-api.onrender.com/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📊 Changements Récapitulatifs

| Fichier | Avant | Après | Status |
|---------|-------|-------|--------|
| `backend/Dockerfile` | `EXPOSE 5000` | `EXPOSE 8080` | ✅ |
| `backend/src/middleware/auth.middleware.js` | MySQL syntax `?` | PostgreSQL syntax `$1` | ✅ |
| `DEPLOYMENT_TROUBLESHOOTING.md` | N/A | Guide complet | ✅ |
| `backend/test-backend.js` | N/A | Script de test | ✅ |

---

## ⚠️ Points Importants

1. **JWT_SECRET:**
   - 🔴 **NE PAS** utiliser une clé simple (ex: "secret")
   - ✅ Générer une clé aléatoire: `openssl rand -base64 32`
   - ✅ Minimum 32 caractères
   - ✅ Différente en production

2. **DATABASE_URL:**
   - Format PostgreSQL: `postgresql://user:password@host:5432/dbname`
   - ✅ Doit être accessible depuis Render
   - ✅ Vérifier avec: `psql $DATABASE_URL -c "SELECT 1;"`

3. **Port:**
   - ✅ Dockerfile expose `8080`
   - ✅ `server.js` utilise `process.env.PORT || 8080`
   - ✅ Render peut override avec variable `PORT`

---

## 🐛 Troubleshooting

### Erreur: "ECONNREFUSED on DATABASE_URL"
```
❌ Base de données n'existe pas ou pas accessible
✅ Solution: Créer PostgreSQL Database sur Render
```

### Erreur: "JWT_SECRET not defined"
```
❌ Variable d'environnement manquante
✅ Solution: Ajouter JWT_SECRET dans Render Environment
```

### Erreur: "Token invalide"
```
❌ JWT_SECRET différente entre auth.routes et auth.middleware
✅ Vérifier: process.env.JWT_SECRET utilisée partout
```

### Erreur: "Non autorisé - Token manquant"
```
❌ Client n'envoie pas le header Authorization
✅ Vérifier: Authorization: Bearer TOKEN format
```

---

## 📞 Besoin d'aide?

Voir le fichier complet: **`DEPLOYMENT_TROUBLESHOOTING.md`**

Contient:
- Configuration complète Render
- Checklist de vérification
- Debugging détaillé
- Génération sécurisée JWT_SECRET
- Exemples de tests cURL
