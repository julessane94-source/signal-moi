# 🔧 Déploiement - Troubleshooting Guide

## ⚠️ Problèmes Identifiés et Corrections

### **1. Problème: Port Incorrectement Configuré**

**Symptôme:**
```
❌ Log dit "Serveur démarré sur le port 5432"
❌ Dockerfile expose port 5000
✅ Mais server.js utilise PORT 8080
```

**Cause:**
- `Dockerfile` expose `5000` (ancien port par défaut)
- `server.js` utilise `process.env.PORT || 8080`
- Render configure le PORT env var, mais le Dockerfile doit correspondre

**Solution Appliquée:**
- ✅ Mis à jour `Dockerfile` pour exposer le port `8080`
- ✅ Serverjs reste sur `PORT env var || 8080` (correct)

**Fichier modifié:** `backend/Dockerfile`

---

### **2. Problème: Syntaxe PostgreSQL Incorrecte en Auth Middleware**

**Symptôme:**
```
❌ req.headers.authorization vérifiés mais tokens ne s'authentifient pas
❌ Erreur: invalid query syntax
```

**Cause:**
`backend/src/middleware/auth.middleware.js` ligne 20:
```javascript
const [users] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
                                                                   ❌ MySQL syntax
```

Vous utilisez PostgreSQL (driver `pg`), qui utilise la syntaxe `$1, $2` pas `?`

**Solution Appliquée:**
```javascript
const result = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
const users = result.rows || [];
```

**Fichier modifié:** `backend/src/middleware/auth.middleware.js`

---

### **3. Problème: Headers Authorization Manquants sur Health Check**

**Symptôme:**
```
📨 HEAD / - Authorization=❌ Manquant
📨 GET / - Authorization=❌ Manquant
```

**Cause:**
C'est normal! Render envoie des health checks sans authentication. Ce n'est pas un problème.

**Solution:**
- ✅ Endpoint `/api/health` ne require pas d'auth (correct)
- ✅ Les logs affichent juste un warning, le serveur fonctionne

---

## 🚀 Configuration Render - Variables d'Environnement ESSENTIELLES

Allez sur votre Render Dashboard → Service → Environment et configurez:

```env
# ====== BASE DE DONNÉES ======
DATABASE_URL=postgresql://user:password@your-db-host:5432/signal_moi_db

# ====== AUTHENTIFICATION (CRITIQUE) ======
JWT_SECRET=your-super-long-random-secret-key-here-minimum-32-chars-CHANGE-ME

# ====== FRONTEND ======
FRONTEND_URL=https://signal-moi.vercel.app

# ====== EMAIL (SMTP) ======
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Signal-Moi <no-reply@signal-moi.fr>"

# ====== RUNTIME ======
NODE_ENV=production
PORT=8080

# ====== OPTIONNEL: S3 pour les uploads ======
USE_S3=false
# Si true, configurer:
# S3_BUCKET=signal-moi-uploads
# S3_REGION=eu-west-1
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
```

### 🔐 Générer une JWT_SECRET sécurisée:

**Sur macOS/Linux:**
```bash
openssl rand -base64 32
```

**Sur Windows PowerShell:**
```powershell
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object {[char][int]::Parse((Get-Random -Min 48 -Max 122).ToString())} | Join-String)))
```

Ou utiliser un générateur en ligne: https://generate-random.org/encryption-key-generator

---

## ✅ Vérifications Post-Déploiement

### 1. Vérifier les Logs Render

```bash
# Dans Render Dashboard: Runtime Logs
✅ "Serveur démarré sur le port 8080"
✅ "JWT_SECRET: ✅ Défini"
✅ "Backend fonctionne"
```

### 2. Test Health Check

```bash
curl https://signal-moi-api.onrender.com/api/health
# Réponse attendue:
# {"status":"OK","message":"Backend fonctionne","timestamp":"..."}
```

### 3. Test Login (avec Auth JWT)

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

# 2. Tester un endpoint protégé avec le token
curl https://signal-moi-api.onrender.com/api/admin/users \
  -H "Authorization: Bearer eyJhbG..."
# Si token OK: Retourne liste d'utilisateurs (ou accès refusé si pas admin)
# Si token absent/invalide: 401 Unauthorized
```

---

## 🐛 Debugging

### Si le serveur ne démarre pas:

1. **Vérifier les Variables d'Env:**
   ```
   Render Dashboard → Runtime Logs
   ```
   Chercher: `✅ DATABASE_URL: Défini` et `✅ JWT_SECRET: Défini`

2. **Erreur: "ECONNREFUSED" sur DATABASE_URL**
   - ❌ Base de données n'existe pas ou est pas accessible
   - ✅ Solution: Créer une PostgreSQL Database sur Render et obtenir l'URL correcte

3. **Erreur: "JWT_SECRET not defined"**
   - ❌ Variable d'environnement manquante
   - ✅ Solution: Ajouter `JWT_SECRET=...` dans Render Environment

### Si l'authentification échoue:

1. Vérifier que le frontend envoie le token:
   ```javascript
   // Dans le client (ex: axios interceptor)
   const token = localStorage.getItem('token');
   headers.Authorization = `Bearer ${token}`;
   ```

2. Vérifier le format du token en réponse de login:
   ```javascript
   // Doit retourner:
   {
     "success": true,
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": { "id": 1, "email": "...", "role": "..." }
   }
   ```

3. Tester la validation du token:
   ```bash
   curl https://signal-moi-api.onrender.com/api/health \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   # Doit retourner 200 OK
   ```

---

## 📋 Checklist Avant Production

- [ ] `DATABASE_URL` configurée et connectée
- [ ] `JWT_SECRET` longue et aléatoire (min 32 chars)
- [ ] `FRONTEND_URL` pointe vers votre Vercel
- [ ] `SMTP_HOST/USER/PASS` configurés pour les emails
- [ ] Dockerfile expose port `8080`
- [ ] Test de santé: GET `/api/health` → 200 OK
- [ ] Test login: POST `/api/auth/login` → retourne token
- [ ] Test endpoint protégé: GET avec header `Authorization: Bearer TOKEN` → 200 OK

---

## 📞 Support

Si des erreurs persistent:
1. Vérifier les Runtime Logs complets (Render Dashboard)
2. Copier le stack trace et chercher dans la doc
3. Vérifier que PostgreSQL driver (`pg`) est installé: `npm ls pg`
