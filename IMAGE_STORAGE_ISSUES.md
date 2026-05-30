# 🖼️ Rapport - Problèmes des Images de Signalement

## ❌ Problèmes Identifiés

### 1. **Stockage non persistant en production (Render/Vercel)**

**Situation**:
- Fichiers uploadés localement dans `uploads/signalements/`
- Render/Vercel n'a PAS de système de fichiers persistant
- À chaque redémarrage du conteneur → fichiers perdus ❌

**Preuve**:
```javascript
// backend/src/middlewares/upload.js ligne 39-43
// ❌ Utilise diskStorage (local) par défaut
if (!USE_S3) {
  storage = multer.diskStorage({
    destination: 'uploads/signalements', // ❌ Perdus à chaque restart
  });
}
```

**Impact**:
- Images uploadées disparaissent après quelques heures
- Les images semblent "non stockées en base de données"

---

### 2. **URL des fichiers incorrect en production**

**Avant** (❌ Incorrect):
```javascript
// backend/src/routes/signalement.routes.js ligne 347
url: f.chemin.startsWith('http') ? f.chemin : 
  `${process.env.API_BASE_URL || 'http://localhost:3000'}/${f.chemin}`
                                     ↑ FRONTEND URL, pas l'API !
```

**Après** (✅ Corrected):
```javascript
// ✅ Maintenant
url: f.chemin.startsWith('http') ? f.chemin : 
  `${process.env.BACKEND_URL || process.env.API_BASE_URL || 'http://localhost:3001'}/${f.chemin}`
                 ↑ BACKEND URL
```

**Impact**:
- Frontend reçoit une URL pointant vers `localhost:3000` (frontend)
- Images ne peuvent pas charger

---

## ✅ Solutions

### **Solution 1: Configuration S3 (Production)**

Sur Render/Vercel, ajouter variables d'environnement :

```bash
USE_S3=true
S3_REGION=eu-west-1              # ou votre région
S3_BUCKET=signal-moi-uploads     # ou le vôtre
AWS_ACCESS_KEY_ID=***
AWS_SECRET_ACCESS_KEY=***
```

**Résultat**:
- Fichiers stockés sur S3 (persistant)
- URL S3 retournée automatiquement

---

### **Solution 2: Variables d'env pour l'URL API**

Ajouter sur Render/Vercel :

```bash
# Option A: URL complète du backend
BACKEND_URL=https://signal-moi-api.render.com

# Ou Option B: Utilise API_BASE_URL existant
# API_BASE_URL=https://signal-moi-api.render.com
```

---

### **Solution 3: Test local avec S3 (optionnel)**

Pour tester S3 localement :

```bash
# .env
USE_S3=true
S3_REGION=eu-west-1
S3_BUCKET=signal-moi-test
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

Redémarrer le backend :
```bash
npm run dev
```

---

## 🧪 Diagnostic Rapide

### Test 1: Vérifier le stockage
```bash
# Sur Render SSH ou local
ls -la backend/uploads/signalements/
# Si VIDE → Fichiers perdus à chaque restart (confirme le problème)
```

### Test 2: Vérifier la base de données
```sql
SELECT nom_fichier, chemin FROM signal_moi.fichiers LIMIT 5;
-- Les entrées devraient exister
-- Chemin: uploads/signalements/xxxx.jpg (local)
--     ou: https://s3.xx.amazonaws.com/... (S3)
```

### Test 3: Vérifier l'URL API
```bash
curl https://signal-moi-api.render.com/api/signalements/[ID] \
  -H "Authorization: Bearer [TOKEN]" | jq '.fichiers[0].url'

# Doit pointer vers https://signal-moi-api.render.com/uploads/...
# PAS vers http://localhost:3000/...
```

---

## 📋 Checklist de Correction

- [ ] Ajouter `BACKEND_URL` en production
- [ ] Configurer S3 sur Render/Vercel (`USE_S3=true`)
- [ ] Redémarrer le backend
- [ ] Tester : créer signalement avec image
- [ ] Tester : afficher signalement et vérifier image
- [ ] Vérifier que l'URL retournée est correcte

---

## 🔗 Fichiers modifiés

✅ **backend/src/routes/signalement.routes.js** (ligne 347)
- URL générée utilise maintenant `BACKEND_URL`

---

## 📞 Prochaine étape

**Pour tester sur l'app déployée (signal-moi.vercel.app)**:
1. Fournis identifiants collaborateur
2. Teste création campagne + image
3. Vérifie si images s'affichent
