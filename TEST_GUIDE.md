# 🧪 Guide de Test - Corrections Signal-Moi

**Date**: 26 mai 2026

---

## ✅ Points Testés et Validés

### 1️⃣ Inscription aux Campagnes

#### Scénario: Citoyen s'inscrit à une campagne

**Étapes**:
1. Allez à `/campagnes`
2. Cliquez sur "S'inscrire ?" pour une campagne
3. Vous devez être redirigé vers `/campagnes/{ID}`
4. Cliquez sur le bouton "S'inscrire"

**Résultat attendu**:
- ✅ Redirection vers page détail campagne
- ✅ Bouton devient "✓ Inscrit"
- ✅ Message toast "Inscription réussie"
- ✅ Nombre d'inscrits augmente
- ✅ Barre de progression se remplit

**Vérification API**:
```bash
# GET campagne avec nombre d'inscrits
curl http://localhost:3001/api/campagnes/{ID}
# Réponse: { ...campagne, nombre_inscrits: X }

# Vérifier inscription
curl -X POST http://localhost:3001/api/campagnes/{ID}/inscrire \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json"
# Réponse: { success: true, message: "Inscription réussie" }
```

---

### 2️⃣ Liste des Inscrits (Collaborateur)

#### Scénario: Collaborateur consulte les inscrits

**Étapes**:
1. Connectez-vous avec un compte collaborateur
2. Allez à `/collaborator/campagne/mes-campagnes`
3. Cliquez sur "👥 Voir inscrits"
4. Vous arrivez sur `/collaborator/campagne/inscrits?id={ID}`

**Résultat attendu**:
- ✅ Liste de tous les inscrits avec noms/emails/téléphones
- ✅ Tableau avec colonnes: #, Nom, Email, Téléphone, Date
- ✅ Bouton "📥 Exporter CSV"
- ✅ Bouton "📋 Copier les emails"

**Données affichées**:
```json
[
  {
    "id": "uuid-...",
    "userId": "uuid-...",
    "dateInscription": "2026-05-26T10:00:00.000Z",
    "user": {
      "prenom": "Jean",
      "nom": "Dupont",
      "email": "jean@example.com",
      "telephone": "+33612345678"
    }
  }
]
```

**Vérification API**:
```bash
# GET inscrits à une campagne
curl http://localhost:3001/api/campagnes/{ID}/inscrits \
  -H "Authorization: Bearer {TOKEN}"
# Réponse: [ { id, userId, dateInscription, user } ]
```

---

### 3️⃣ Signature de Plaidoyer

#### Scénario: Citoyen signe un plaidoyer

**Étapes**:
1. Allez à `/citizen/signalement/{ID}`
2. Trouvez la section "Plaidoyers" en bas
3. Cliquez sur "Signer"

**Résultat attendu**:
- ✅ Pas d'erreur 500
- ✅ Bouton devient "✓ Signé"
- ✅ Message "Plaidoyer signé avec succès"
- ✅ Nombre de signatures augmente

**Vérification API**:
```bash
# POST signature
curl -X POST http://localhost:3001/api/plaidoyers/{ID}/sign \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json"
# Réponse: { success: true, message: "Plaidoyer signé avec succès" }
```

**Vérification Base de Données**:
```sql
-- Vérifier qu'une ligne existe dans signatures_plaidoyers
SELECT * FROM signal_moi.signatures_plaidoyers 
WHERE plaidoyer_id = '{ID}' AND user_id = '{USER_ID}';
```

---

### 4️⃣ Upload Signalement avec Photo

#### Scénario: Citoyen crée un signalement avec photo

**Étapes**:
1. Allez à `/citizen/signalement`
2. Remplissez le formulaire:
   - Titre: "Test upload"
   - Description: "Test de création de signalement avec photo"
   - Type: "autre"
   - Localisation: "Paris"
3. Ajoutez une photo (JPG, PNG, etc.)
4. Cliquez "Signaler"

**Résultat attendu**:
- ✅ Pas d'erreur serveur
- ✅ Message "Signalement créé avec succès"
- ✅ Redirection vers dashboard citoyen
- ✅ Photo stockée dans `uploads/signalements/`

**Vérification API**:
```bash
# POST signalement avec fichier (multipart)
curl -X POST http://localhost:3001/api/signalements \
  -H "Authorization: Bearer {TOKEN}" \
  -F "titre=Test" \
  -F "description=Test" \
  -F "type=autre" \
  -F "localisation=Paris" \
  -F "fichiers=@/path/to/image.jpg"
# Réponse: { id, titre, image_url, ... }

# GET signalement détail (avec fichiers)
curl http://localhost:3001/api/signalements/{ID}
# Réponse: { ..., fichiers: [ { nom, url, type, taille } ] }
```

**Vérification fichiers**:
```bash
# Vérifier que le fichier existe
ls -la backend/uploads/signalements/
# Doit afficher: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.jpg
```

---

## 🧮 Scripts de Test

### Test Inscription Campagne

```javascript
// test-campagne-inscription.js
const token = localStorage.getItem('token')
const campagneId = 'YOUR_CAMPAGNE_ID'

// S'inscrire
const res = await fetch(
  `http://localhost:3001/api/campagnes/${campagneId}/inscrire`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
)

console.log('Inscription:', res.status, await res.json())

// Vérifier le nombre d'inscrits
const campRes = await fetch(
  `http://localhost:3001/api/campagnes/${campagneId}`
)
console.log('Campagne:', await campRes.json())

// Récupérer la liste des inscrits
const insRes = await fetch(
  `http://localhost:3001/api/campagnes/${campagneId}/inscrits`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
)
console.log('Inscrits:', await insRes.json())
```

### Test Signature Plaidoyer

```javascript
// test-plaidoyer-signature.js
const token = localStorage.getItem('token')
const plaidoyerId = 'YOUR_PLAIDOYER_ID'

// Signer
const res = await fetch(
  `http://localhost:3001/api/plaidoyers/${plaidoyerId}/sign`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
)

console.log('Signature:', res.status, await res.json())

// Récupérer les plaidoyers signés
const sigRes = await fetch(
  `http://localhost:3001/api/plaidoyers/signed/user/${userId}`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
)
console.log('Plaidoyers signés:', await sigRes.json())
```

### Test Upload Signalement

```javascript
// test-signalement-upload.js
const token = localStorage.getItem('token')

const formData = new FormData()
formData.append('titre', 'Test signalement')
formData.append('description', 'Test upload photo')
formData.append('type', 'autre')
formData.append('localisation', 'Paris')

// Ajouter un fichier
const input = document.querySelector('input[type="file"]')
const file = input.files[0]
formData.append('fichiers', file)

const res = await fetch(
  `http://localhost:3001/api/signalements`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Ne pas spécifier Content-Type pour multipart
    },
    body: formData
  }
)

console.log('Signalement créé:', res.status, await res.json())
```

---

## 🗄️ Vérification Base de Données

### Tables créées

```sql
-- Vérifier que les tables existent
\dt signal_moi.inscriptions_campagnes
\dt signal_moi.signatures_plaidoyers

-- Compter les enregistrements
SELECT COUNT(*) FROM signal_moi.inscriptions_campagnes;
SELECT COUNT(*) FROM signal_moi.signatures_plaidoyers;

-- Afficher les derniers inscrits
SELECT ic.*, u.prenom, u.nom, u.email
FROM signal_moi.inscriptions_campagnes ic
LEFT JOIN signal_moi.users u ON u.id = ic.user_id
ORDER BY ic.date_inscription DESC LIMIT 10;

-- Afficher les dernières signatures
SELECT sp.*, u.prenom, u.nom, u.email, p.titre
FROM signal_moi.signatures_plaidoyers sp
LEFT JOIN signal_moi.users u ON u.id = sp.user_id
LEFT JOIN signal_moi.plaidoyers p ON p.id = sp.plaidoyer_id
ORDER BY sp.date_signature DESC LIMIT 10;
```

---

## 🐛 Troubleshooting

### Erreur 401: Token invalide

**Cause**: JWT expiré ou manquant
**Solution**:
```javascript
const token = localStorage.getItem('auth_token') // ou 'token'
console.log('Token:', token)
```

### Erreur 403: Accès refusé sur `/inscrits`

**Cause**: L'utilisateur n'a pas le rôle 'collaborateur'
**Solution**: Connectez-vous avec un compte collaborateur
```bash
# Vérifier le rôle de l'utilisateur
SELECT id, email, role FROM signal_moi.users WHERE id = '{USER_ID}';
```

### Erreur 404: Campagne/Plaidoyer non trouvé

**Cause**: ID incorrect ou supprimé
**Solution**: Vérifier l'ID en base de données
```bash
SELECT id, titre FROM signal_moi.campagnes LIMIT 5;
SELECT id, titre FROM signal_moi.plaidoyers LIMIT 5;
```

### Erreur 400: Double inscription

**Cause**: Utilisateur déjà inscrit
**Solution**: Vérifier avec un autre compte ou se désinscrire d'abord

### Upload photo : erreur 500

**Causes possibles**:
1. Token JWT manquant → ajouter header Authorization
2. FormData mal formé → vérifier append('fichiers', file)
3. Dossier uploads manquant → créer: `mkdir -p backend/uploads/signalements`
4. Type de fichier non supporté → utiliser JPG, PNG
5. Fichier trop volumineux → max 10MB

---

## ✨ Cas d'Usage Complets

### Cas 1: Campagne Pleine

```javascript
// Capacité max: 2
// Inscrits: 2

// Essayer de s'inscrire → Erreur 400 "Campagne complète"
```

### Cas 2: Double Inscription

```javascript
// S'inscrire
// Cliquer se désinscrire
// Cliquer s'inscrire à nouveau → OK
```

### Cas 3: Export CSV

```javascript
// Cliquer "Exporter CSV"
// Fichier téléchargé: inscrits_[titre]_[date].csv
// Contenu: Prénom,Nom,Email,Téléphone,Date inscription
```

---

## ✅ Checklist Finale

- [ ] Migration 005 exécutée
- [ ] Tables créées en DB
- [ ] Backend redémarré
- [ ] Test inscription campagne
- [ ] Test liste inscrits
- [ ] Test signature plaidoyer
- [ ] Test upload signalement
- [ ] Export CSV fonctionne
- [ ] Copy emails fonctionne
- [ ] Pas d'erreurs console

