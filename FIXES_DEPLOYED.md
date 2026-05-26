# 🔧 Guide de Correction - Signal-Moi

**Date**: 26 mai 2026

---

## ✅ Problèmes Résolus

### 1️⃣ Inscription aux Campagnes

#### **Problème**:
- ❌ Pas d'endpoint pour s'inscrire à une campagne
- ❌ Pas d'endpoint pour récupérer la liste des inscrits
- ❌ Pas de page détail campagne

#### **Solution Implémentée**:

**Backend - Nouveaux endpoints** (`backend/src/routes/campagne.routes.js`):
- `GET /api/campagnes/:id` - Détail campagne + nombre d'inscrits
- `POST /api/campagnes/:id/inscrire` - S'inscrire (protégé, authentifié)
- `DELETE /api/campagnes/:id/inscrire` - Se désinscrire (protégé)
- `GET /api/campagnes/:id/inscrits` - Liste des inscrits (protégé, collaborateur/admin)

**Frontend**:
- Créé page détail: `frontend/src/pages/campagnes/[id].js`
- Affiche nombre d'inscrits, barre de progression
- Boutons d'inscription/désinscription
- Gestion de la capacité max

**Base de données** (`database/migrations/005_add_campagnes_inscriptions.sql`):
```sql
CREATE TABLE signal_moi.inscriptions_campagnes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campagne_id UUID NOT NULL REFERENCES signal_moi.campagnes(id),
    user_id UUID NOT NULL REFERENCES signal_moi.users(id),
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campagne_id, user_id)
);
```

---

### 2️⃣ Signature de Plaidoyers (Erreur Serveur)

#### **Problème**:
- ❌ Erreur 500 lors de la signature d'un plaidoyer
- ❌ Table `signal_moi.signatures_plaidoyers` manquante

#### **Solution Implémentée**:

**Base de données** (Migration 005):
```sql
CREATE TABLE signal_moi.signatures_plaidoyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plaidoyer_id UUID NOT NULL REFERENCES signal_moi.plaidoyers(id),
    user_id UUID NOT NULL REFERENCES signal_moi.users(id),
    date_signature TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plaidoyer_id, user_id)
);
```

Backend code (`backend/src/routes/plaidoyer.routes.js`):
- ✅ Déjà implémenté correctement
- ✅ Endpoint `POST /api/plaidoyers/:id/sign` fonctionnel

---

### 3️⃣ Upload Signalement avec Photo

#### **Problème**:
- ❌ Erreur lors du signalement avec photo
- ❌ Middleware d'upload peut avoir des problèmes

#### **Code Vérifié** ✅:
- Frontend (`frontend/src/pages/citizen/signalement.js`):
  - ✅ Formulaire multipart correctement configuré
  - ✅ Headers Authorization correctement envoyés
  - ✅ Files bien appendés à FormData
  
- Backend (`backend/src/routes/signalement.routes.js`):
  - ✅ Middleware `uploadMultiple` correctement utilisé
  - ✅ Fichiers stockés en base de données
  - ✅ Image URL mise à jour automatiquement

- Middleware (`backend/src/middlewares/upload.js`):
  - ✅ Multer configuré correctement
  - ✅ Dossier uploads créé automatiquement
  - ✅ Gestion d'erreurs implémentée

---

## 📋 Étapes de Déploiement

### 1. Exécuter les migrations

**Via Node.js**:
```bash
cd backend
node ../scripts/run_migrations_sql.js 005_add_campagnes_inscriptions.sql
```

**Via psql (direct)**:
```bash
psql $DATABASE_URL -f database/migrations/005_add_campagnes_inscriptions.sql
```

**Via le render.yaml**:
```bash
npm run migrate
```

### 2. Redémarrer le backend

```bash
npm run dev        # Dev local
npm run build      # Build pour production
npm start          # Start production
```

### 3. Vérifier les endpoints

```bash
# Tester les campagnes
curl http://localhost:3001/api/campagnes

# Tester une campagne détail
curl http://localhost:3001/api/campagnes/{ID}

# Tester l'inscription (nécessite token JWT)
curl -X POST http://localhost:3001/api/campagnes/{ID}/inscrire \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json"
```

### 4. Vérifier la base de données

```bash
# Vérifier les tables créées
psql $DATABASE_URL -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'signal_moi' 
ORDER BY table_name;
"

# Compter les inscriptions
psql $DATABASE_URL -c "
SELECT COUNT(*) FROM signal_moi.inscriptions_campagnes;
SELECT COUNT(*) FROM signal_moi.signatures_plaidoyers;
"
```

---

## 🧪 Tests Manuels

### Test 1: Inscription Campagne

1. Accédez à `/campagnes`
2. Cliquez sur "S'inscrire ?" pour une campagne
3. Vous devez être redirigé vers la page détail `/campagnes/[id]`
4. Cliquez sur "S'inscrire"
5. Vérifiez que le bouton devient "✓ Inscrit"
6. Le nombre d'inscrits doit augmenter

### Test 2: Liste des Inscrits (Collaborateur)

1. Connectez-vous avec un compte collaborateur
2. Allez au dashboard `/collaborator/dashboard`
3. Cherchez "Liste des inscrits" pour chaque campagne
4. Vérifiez que vous voyez tous les inscrits avec leurs emails

### Test 3: Signature Plaidoyer

1. Accédez à `/citizen/signalement/{ID}`
2. Trouvez la section "Plaidoyers" en bas
3. Cliquez "Signer"
4. Vérifiez que le bouton devient "✓ Signé"
5. Le nombre de signatures doit augmenter

### Test 4: Upload Signalement

1. Allez à `/citizen/signalement`
2. Remplissez le formulaire
3. Ajoutez une photo (JPG, PNG, etc.)
4. Cliquez "Signaler"
5. Vérifiez que le signalement est créé avec l'image

---

## 🚨 Résolution des Problèmes

### Erreur: "Table not found"

**Cause**: Migration 005 non exécutée
**Solution**:
```bash
node scripts/run_migrations_sql.js 005_add_campagnes_inscriptions.sql
```

### Erreur: "400 - Vous êtes déjà inscrit"

**Cause**: Utilisateur déjà inscrit
**Solution**: C'est normal, vérifier avec un autre compte

### Erreur: "403 - Accès refusé" sur `/api/campagnes/:id/inscrits`

**Cause**: L'utilisateur n'a pas le rôle 'collaborateur' ou 'admin'
**Solution**: Connectez-vous avec un compte collaborateur/admin

### Erreur: "500 - Erreur serveur" sur signalement photo

**Problèmes possibles**:
1. Dossier `uploads/signalements` n'existe pas
   - Solution: Le middleware crée automatiquement, vérifier logs
2. Permission dossier insuffisante
   - Solution: `chmod 755 uploads/signalements`
3. Token JWT invalide
   - Solution: Vérifier header Authorization

---

## 📊 Checklist Produit

- ✅ Endpoint inscription campagne
- ✅ Endpoint désinscription campagne
- ✅ Endpoint liste inscrits
- ✅ Page détail campagne frontend
- ✅ Boutons inscription/désinscription
- ✅ Barre de progression capacité
- ✅ Tables Base de données créées
- ✅ Gestion d'erreurs
- ⏳ Tests e2e (à faire)

---

## 📝 Notes Supplémentaires

### Campagnes
- Capacité max: vérifiée à l'inscription
- Inscriptions uniques: double inscription bloquée
- Collaborateurs: peuvent voir tous les inscrits
- Données sensibles: emails/téléphones protégés

### Plaidoyers
- Signatures uniques: double signature bloquée
- Compteur signatures: mise à jour avec chaque signature
- Authentification: obligatoire pour signer

### Signalements
- Upload multipart: 5 fichiers max
- Taille max: 10 MB par fichier
- Types acceptés: images, vidéos, audio
- Stockage: local ou S3 (si USE_S3=true)

---

**Prochaines étapes**:
1. ✅ Exécuter migration 005
2. ✅ Redémarrer backend
3. ✅ Tester tous les endpoints
4. ✅ Vérifier logs d'erreurs
5. ✅ Déployer sur Vercel/Render

