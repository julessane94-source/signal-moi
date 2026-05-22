# 🔧 Signal-Moi : Corrections Critiques Apportées

## ✅ Bugs Corrigés

### **BUG #1 : Authentification Cassée (CRITIQUE)**
**Problème**: Dans `auth.routes.js`, la vérification du mot de passe était:
```javascript
const validPassword = (password === user.password);  // ❌ MAUVAIS
```
Cela comparait le mot de passe en clair avec le hash en base → **JAMAIS valide!**

**Solution**: Utiliser `bcrypt.compare()` pour vérifier les hashes
```javascript
const validPassword = await bcrypt.compare(password, user.password);  // ✅ CORRECT
```

✨ **Impact**: Les admins et citoyens peuvent maintenant se connecter!

---

### **BUG #2 : Tokens Non-Sécurisés**
**Problème**: Tokens générés en Base64 simple (non-JWT):
```javascript
const token = Buffer.from(JSON.stringify({...})).toString('base64');  // ❌ Non-sécurisé
```

**Solution**: Utiliser JWT avec `JWT_SECRET`:
```javascript
const token = jwt.sign({...}, process.env.JWT_SECRET || 'dev-secret-key', { expiresIn: '7d' });  // ✅ Sécurisé
```

✨ **Impact**: Authentication tokens sont maintenant sécurisés et expiring!

---

### **BUG #3 : Routes de Signalement Non-Protégées**
**Problème**: N'importe qui pouvait créer un signalement sans authentification!
```javascript
router.post('/', async (req, res) => {  // ❌ Pas de protection
    const { user_id, ... } = req.body;  // ❌ user_id pouvait être falsifié
```

**Solution**: Ajouter middleware d'authentification + récupérer user_id du token JWT
```javascript
router.post('/', authMiddleware, async (req, res) => {  // ✅ Protégé
    const user_id = req.user.id;  // ✅ Du token JWT, pas du body
```

✨ **Impact**: Les signalements sont maintenant créés avec l'utilisateur correct!

---

### **BUG #4 : Routes Admin Non-Protégées**
**Problème**: N'importe qui pouvait accéder aux endpoints admin!

**Solution**: Ajouter middleware `authMiddleware` avec vérification du rôle 'admin'

✨ **Impact**: Seuls les admins peuvent gérer les utilisateurs!

---

### **BUG #5 : Routes Campagne Non-Protégées**
**Problème**: N'importe qui pouvait créer des campagnes

**Solution**: Ajouter middleware d'authentification sur POST /campagnes

✨ **Impact**: Création de campagne réservée aux utilisateurs authentifiés!

---

### **BUG #6 : Accès aux Signalements d'Autres Utilisateurs**
**Problème**: Les citoyens pouvaient voir les signalements des autres!
```javascript
router.get('/user/:userId', async (req, res) => {  // Pas de vérification
```

**Solution**: Ajouter middleware + vérifier que l'utilisateur accède à ses propres signalements
```javascript
if (parseInt(userId) !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
}
```

✨ **Impact**: Chacun ne voit que ses propres signalements!

---

## 🚀 Prochaines Étapes pour Render Deployment

### 1️⃣ **Variables d'Environnement à Configurer sur Render**

Accédez à votre Web Service Render → Environment:

```env
# Base de données PostgreSQL
DATABASE_URL=postgresql://user:password@your-db-host:5432/signal_moi_db

# 🔐 CRITIQUE: Générer une clé JWT sécurisée
JWT_SECRET=your-super-long-random-secret-key-here-minimum-32-chars

# Frontend Vercel
FRONTEND_URL=https://your-signal-moi-site.vercel.app

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optionnel: S3 pour uploads
S3_BUCKET=signal-moi-uploads
S3_KEY=your-aws-key
S3_SECRET=your-aws-secret

NODE_ENV=production
```

### 2️⃣ **Redéployer sur Render**

1. Commit & push vos changements vers GitHub:
```bash
git add -A
git commit -m "fix: critical auth bugs - password hashing, JWT tokens, protected routes"
git push
```

2. Render se redéploiera automatiquement (ou force re-deploy manuellement)

### 3️⃣ **Tester la Connexion Admin**

```bash
# Test 1: Créer un admin (localement ou via admin panel)
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "prenom":"Admin",
    "nom":"User",
    "email":"admin@signal-moi.fr",
    "password":"SecurePass123!",
    "telephone":"0600000000",
    "ville":"Paris",
    "quartier":"Marais"
  }'

# Test 2: Connexion
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@signal-moi.fr",
    "password":"SecurePass123!"
  }'
# → Récupérer le token JWT

# Test 3: Créer un signalement (avec token JWT)
curl -X POST http://localhost:8080/api/signalements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "titre":"Nid de poule",
    "description":"Grand trou dans la route",
    "type":"Infrastructure",
    "localisation":"48 rue de la Paix, Paris",
    "latitude":48.8566,
    "longitude":2.3522
  }'
```

### 4️⃣ **Vérifier les Signalements en Base de Données**

Sur PostgreSQL (Render ou localement):
```sql
SELECT id, user_id, titre, created_at FROM signalements ORDER BY created_at DESC;
SELECT id, prenom, nom, email, role FROM users;
```

---

## 📋 Fichiers Modifiés

1. ✅ `backend/src/routes/auth.routes.js` - Corrected password verification + JWT tokens
2. ✅ `backend/src/routes/signalement.routes.js` - Added auth middleware + secure user_id
3. ✅ `backend/src/routes/admin.routes.js` - Added auth + role verification
4. ✅ `backend/src/routes/campagne.routes.js` - Added auth middleware
5. ✅ `backend/src/server.js` - Added env vars check + improved logging

---

## 🎯 Résumé des Changements

| Bug | Avant | Après |
|-----|-------|-------|
| **Password check** | `password === hash` ❌ | `bcrypt.compare()` ✅ |
| **Auth tokens** | Base64 simple | JWT sécurisé |
| **Signalements** | Ouvert à tous | Protégé par JWT |
| **user_id** | Du body (falsifiable) | Du token JWT |
| **Routes admin** | Ouvertes | Protégées + role check |
| **Visibilité signalements** | Tous visibles par tous | Utilisateur ne voit que les siens |

---

## 🔔 Important

Assurez-vous que:
- ✅ `JWT_SECRET` est configuré sur Render
- ✅ `FRONTEND_URL` pointe vers votre Vercel
- ✅ La base de données PostgreSQL sur Render est active
- ✅ Redéploiement effectué après les changements

Après déploiement, les utilisateurs doivent:
1. Se connecter correctement (bug d'auth corrigé)
2. Voir leurs signalements s'enregistrer en BD (bug de création corrigé)
3. Ne voir que leurs propres signalements (bug d'accès corrigé)

Questions ou problèmes? Consultez les logs Render: `Runtime Logs` → Cherchez les erreurs 🐛
