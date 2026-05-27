# ✅ Correction Complète - Boutons Campagnes et Plaidoyers

**Date**: 27 mai 2026  
**Status**: ✅ Complet

---

## 🔧 Résumé des Corrections

### 🐛 Problèmes Identifiés et Résolus

#### 1. **Erreur 500 - Signature Plaidoyers** ✅
- **Cause**: Noms de tables PostgreSQL manquaient du schéma `signal_moi.`
- **Fichier**: `backend/src/routes/plaidoyer.routes.js`
- **Solution**: Ajout du schéma à toutes les requêtes SQL
  - `plaidoyers` → `signal_moi.plaidoyers`
  - `signatures_plaidoyers` → `signal_moi.signatures_plaidoyers`

#### 2. **Bouton "S'inscrire" Ne Fonctionne Pas** ✅
- **Cause 1**: État `isInscribed` jamais initialisé au chargement de la page
- **Cause 2**: Pas d'endpoint pour vérifier l'inscription existante
- **Fichiers**:
  - `backend/src/routes/campagne.routes.js`
  - `frontend/src/pages/campagnes/[id].js`
- **Solution**:
  - ✅ Nouvel endpoint: `GET /api/campagnes/:id/inscrit`
  - ✅ Fonction `checkInscription()` au chargement du composant
  - ✅ État `isInscribed` initialisé correctement

#### 3. **Incohérence Tokens localStorage** ✅
- **Cause**: Mélange de noms (`token` vs `auth_token`)
- **Fichiers corrigés**:
  - `frontend/src/pages/citizen/signalement/[id].js`
  - `frontend/src/pages/campagnes/[id].js`
- **Solution**: Standardisé sur `token` (le bon nom utilisé par AuthContext)

---

## 📋 Fichiers Modifiés

### Backend (2 fichiers)

```
backend/src/routes/
├── plaidoyer.routes.js    [✅ MODIFIÉ] - Ajoute schéma signal_moi
└── campagne.routes.js     [✅ MODIFIÉ] - Nouvel endpoint inscrit
```

### Frontend (2 fichiers)

```
frontend/src/pages/
├── campagnes/[id].js      [✅ MODIFIÉ] - Initialise isInscribed
└── citizen/signalement/[id].js [✅ MODIFIÉ] - Corrige tokens
```

---

## 🚀 Déploiement

### Étape 1: Migrations (si non encore exécutées)
```bash
cd backend
node ../scripts/run_migrations_sql.js 005_add_campagnes_inscriptions.sql
```

### Étape 2: Redémarrer le Backend
```bash
cd backend
npm run dev
```

### Étape 3: Tester les Bouttons
- Voir `TEST_BUTTONS.md` pour les procédures complètes

---

## 🧪 Vérification Rapide

### Test 1: Inscription Campagne
```bash
# 1. Obtenir le token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@signal-moi.fr","password":"Password123!"}'

# 2. S'inscrire à une campagne
curl -X POST http://localhost:3001/api/campagnes/{CAMPAGNE_ID}/inscrire \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json"

# Réponse attendue:
# { "success": true, "message": "Inscription réussie", "inscription": {...} }
```

### Test 2: Signature Plaidoyer
```bash
# Signer un plaidoyer
curl -X POST http://localhost:3001/api/plaidoyers/{PLAIDOYER_ID}/sign \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json"

# Réponse attendue:
# { "success": true, "message": "Plaidoyer signe avec succes", "signature": {...} }
```

---

## 📊 Endpoints Concernés

| Endpoint | Méthode | Auth | Changement |
|----------|---------|------|-----------|
| `/api/campagnes` | GET | ❌ | ✅ Fonctionne |
| `/api/campagnes/:id` | GET | ❌ | ✅ Fonctionne |
| `/api/campagnes/:id/inscrit` | GET | ✅ | ✨ NOUVEAU |
| `/api/campagnes/:id/inscrire` | POST | ✅ | ✅ Fonctionne |
| `/api/plaidoyers` | GET | ❌ | ✅ Corrigé |
| `/api/plaidoyers/signed/user/:id` | GET | ✅ | ✅ Corrigé |
| `/api/plaidoyers/:id/sign` | POST | ✅ | ✅ Corrigé |

---

## 💡 Notes Importantes

### 1. **Migrations Obligatoires**
La table `signal_moi.inscriptions_campagnes` et `signal_moi.signatures_plaidoyers` doivent exister.
Migration: `005_add_campagnes_inscriptions.sql`

### 2. **Authentification**
- Token stocké: `localStorage.getItem('token')`
- Tous les endpoints d'inscription/signature nécessitent l'authentification
- Header: `Authorization: Bearer {TOKEN}`

### 3. **États Frontend**
- `isInscribed`: Mis à jour au chargement et après chaque action
- Les boutons réagissent correctement aux états
- Rechargement page = rechargement état (idempotent)

---

## ✅ Checklist Finale

- [x] plaidoyer.routes.js - Schéma ajouté
- [x] campagne.routes.js - Nouvel endpoint
- [x] campagnes/[id].js - Initialisation isInscribed
- [x] signalement/[id].js - Tokens corrigés
- [x] Scripts de test créés
- [x] Documentation complète
- [ ] Tests e2e (optionnel)
- [ ] Performance monitoring (optionnel)

---

## 🆘 Dépannage Rapide

| Problème | Solution |
|----------|----------|
| Erreur 500 sur signature | Vérifier migrations exécutées |
| Bouton "S'inscrire" grisé | Vérifier authentification (token) |
| État d'inscription pas persisté | Rechargement page ou vérifier BDD |
| Token invalide | Se reconnecter via `/login` |

---

## 📞 Support

Pour plus de détails, voir:
- `TEST_BUTTONS.md` - Procédures de test complètes
- `FIXES_DEPLOYED.md` - Documentation précédente
- Logs backend: `npm run dev` dans `backend/`
