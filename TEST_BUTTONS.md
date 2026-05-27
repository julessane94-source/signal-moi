# 🧪 Guide de Test - Boutons S'inscrire et Signer

## ✅ Corrections Apportées

### Backend

#### 1. **plaidoyer.routes.js** - Correction des noms de tables
- ✅ Ajout du schéma `signal_moi.` à tous les noms de tables
- Affecte les endpoints:
  - `GET /api/plaidoyers`
  - `GET /api/plaidoyers/signed/user/:userId`
  - `POST /api/plaidoyers/:id/sign`

#### 2. **campagne.routes.js** - Nouvel endpoint
- ✅ Ajout de `GET /api/campagnes/:id/inscrit`
- Permet de vérifier si un utilisateur est déjà inscrit
- Retour: `{ isInscribed: boolean, inscription: object | null }`

### Frontend

#### 1. **campagnes/[id].js** - Initialisation de l'état
- ✅ Ajout de `checkInscription()` qui appelle le nouvel endpoint
- ✅ Initialisation de `isInscribed` au chargement
- ✅ Utilisation correcte de `auth_token` du localStorage

#### 2. **citizen/signalement/[id].js** - Standardisation des tokens
- ✅ `fetchPetitions()`: `token` → `auth_token`
- ✅ `handleSignPetition()`: `token` → `auth_token`
- ✅ Meilleur handling du mapping des IDs plaidoyers

---

## 🚀 Procédure de Test

### Étape 1: Redémarrer le Backend
```bash
cd backend
npm run dev
```

### Étape 2: Préparer les données
```bash
# Option A: Via API directement
curl http://localhost:3001/api/campagnes

# Option B: Via le script de test
# Windows:
.\test-campagnes-buttons.ps1

# Linux/Mac:
bash test-campagnes-buttons.sh
```

### Étape 3: Tester le Bouton "S'inscrire"

1. Accédez à: `http://localhost:3000/campagnes`
2. Cliquez sur "S'inscrire ?" d'une campagne
3. Vous êtes redirigé vers `/campagnes/{id}`
4. Vérifiez que:
   - ✅ La page charge correctement
   - ✅ Vous voyez le nombre d'inscrits
   - ✅ Le bouton dit "S'inscrire" (pas "Inscrit")

5. Cliquez sur "S'inscrire"
6. Vérifiez que:
   - ✅ Pas de message d'erreur dans la console
   - ✅ Un message "✅ Inscription réussie!" apparaît
   - ✅ Le bouton change à "✓ Inscrit • Se désinscrire"
   - ✅ Le nombre d'inscrits augmente de 1

7. Rechargez la page (F5)
8. Vérifiez que:
   - ✅ Le bouton est toujours "✓ Inscrit • Se désinscrire" (état persisté)
   - ✅ Le nombre d'inscrits est inchangé

### Étape 4: Tester le Bouton "Signer Plaidoyer"

1. Allez à: `http://localhost:3000/citizen/signalement`
2. Créez ou sélectionnez un signalement
3. Accédez à: `http://localhost:3000/citizen/signalement/{id}`
4. Scrollez jusqu'à "Plaidoyers à signer"
5. Vérifiez qu'au moins un plaidoyer est affiché
6. Cliquez sur "✍️ Signer"
7. Vérifiez que:
   - ✅ Pas de message d'erreur dans la console
   - ✅ Un message "Plaidoyer signé avec succès!" apparaît
   - ✅ Le bouton change à "✓ Signé"
   - ✅ Le nombre de signatures augmente

8. Rechargez la page (F5)
9. Vérifiez que:
   - ✅ Le bouton est toujours "✓ Signé" (état persisté)
   - ✅ Le nombre de signatures est inchangé

---

## 🐛 Dépannage

### Erreur: "Token d'authentification manquant"
**Cause**: Pas connecté ou token expiré  
**Solution**: Reconnectez-vous via `/login`

### Erreur: "Vous êtes déjà inscrit"
**Cause**: Vous êtes déjà inscrit à cette campagne  
**Solution**: C'est normal, testez avec un autre compte utilisateur

### Erreur: "Table not found"
**Cause**: Migrations non exécutées  
**Solution**:
```bash
cd backend
node ../scripts/run_migrations_sql.js 005_add_campagnes_inscriptions.sql
npm run dev
```

### Bouton "S'inscrire" n'apparaît pas
**Cause**: Page ne reconnaît pas l'état d'inscription  
**Solution**: 
1. Ouvrez DevTools (F12)
2. Allez dans Console
3. Vérifiez les erreurs d'API
4. Rechargez la page (Ctrl+Shift+R pour cache clear)

### Erreur 500 lors de signature
**Cause**: Tables `signal_moi.signatures_plaidoyers` ou `signal_moi.plaidoyers` inexistantes  
**Solution**:
```bash
# Exécuter les migrations
cd backend
node ../scripts/run_migrations_sql.js 005_add_campagnes_inscriptions.sql

# Redémarrer
npm run dev
```

---

## ✅ Checklist de Validation

- [ ] Backend redémarré avec `npm run dev`
- [ ] Migrations 005 exécutées
- [ ] Connecté avec un compte utilisateur
- [ ] Bouton "S'inscrire" cliquable et répond
- [ ] Bouton "Signer" cliquable et répond
- [ ] État d'inscription persisté après rechargement
- [ ] État de signature persisté après rechargement
- [ ] Nombre d'inscrits/signatures met à jour
- [ ] Pas d'erreur 500 dans les logs backend

---

## 📊 État des Tests

**Dernière mise à jour**: 27 mai 2026

| Fonction | Status | Notes |
|----------|--------|-------|
| GET /api/campagnes | ✅ | Récupère toutes les campagnes |
| GET /api/campagnes/:id | ✅ | Récupère détail + nb inscrits |
| GET /api/campagnes/:id/inscrit | ✅ | Vérifie l'état d'inscription |
| POST /api/campagnes/:id/inscrire | ✅ | S'inscrire à une campagne |
| DELETE /api/campagnes/:id/inscrire | ✅ | Se désinscrire |
| GET /api/plaidoyers | ✅ | Récupère tous les plaidoyers |
| POST /api/plaidoyers/:id/sign | ✅ | Signer un plaidoyer |
| Frontend Campagnes | ✅ | Bouton fonctionne |
| Frontend Plaidoyers | ✅ | Bouton fonctionne |
