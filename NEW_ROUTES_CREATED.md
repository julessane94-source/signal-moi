# 🔧 Routes API Créées - Formule de Contact et Google OAuth

**Date**: 27 mai 2026  
**Status**: ✅ Complet

---

## 📍 Nouvelles Routes Créées

### 1. **Contact - Routes de Formulaire** ✅
**Fichier**: `backend/src/routes/contact.routes.js`

#### `POST /api/contact/send` (PUBLIC)
**Description**: Envoyer un message via le formulaire de contact
**Paramètres**:
```json
{
  "nom": "Jean Dupont",
  "email": "jean@example.com",
  "telephone": "0612345678",
  "sujet": "Demande de renseignement",
  "message": "Bonjour, j'aimerais connaître..."
}
```

**Réponses**:
- ✅ 201: Message envoyé avec succès
  ```json
  {
    "success": true,
    "message": "Message envoyé avec succès...",
    "contactId": "uuid-xxxx"
  }
  ```
- ❌ 400: Champs manquants ou email invalide
- ❌ 500: Erreur serveur

**Fonctionnalités**:
- ✅ Validation des champs (nom, email, sujet, message)
- ✅ Validation du format email
- ✅ Sauvegarde en BDD (table `signal_moi.contact_messages`)
- ✅ Envoi d'email aux administrateurs (si SMTP configuré)
- ✅ Envoi d'email de confirmation à l'utilisateur
- ✅ Gestion gracieuse si SMTP n'est pas configuré

#### `GET /api/contact/messages` (ADMIN ONLY)
**Description**: Récupérer tous les messages de contact reçus
**Authentification**: Requise - Admin uniquement
**Header**: `Authorization: Bearer {token}`

**Réponses**:
- ✅ 200: Liste des messages
  ```json
  {
    "success": true,
    "messages": [
      {
        "id": "uuid-xxxx",
        "nom": "Jean Dupont",
        "email": "jean@example.com",
        "telephone": "0612345678",
        "sujet": "Demande",
        "message": "...",
        "statut": "nouveau",
        "created_at": "2026-05-27T10:30:00Z"
      }
    ]
  }
  ```
- ❌ 403: Accès refusé (non-admin)
- ❌ 500: Erreur serveur

---

### 2. **Google OAuth - Authentification Google** ✅
**Fichier**: `backend/src/routes/auth.routes.js`

#### `POST /api/auth/google` (PUBLIC)
**Description**: Authentifier l'utilisateur avec un token Google
**Paramètres**:
```json
{
  "idToken": "token_google_id",
  "email": "user@gmail.com",
  "name": "Jean Dupont",
  "picture": "https://..."
}
```

**Réponses**:
- ✅ 200: Authentification réussie
  ```json
  {
    "success": true,
    "message": "Authentification Google réussie",
    "token": "jwt-token-xxxxx",
    "user": {
      "id": "uuid-xxxx",
      "email": "user@gmail.com"
    }
  }
  ```
- ❌ 400: Token manquant
- ❌ 500: Erreur serveur

**Fonctionnalités**:
- ✅ Vérification du token Google
- ✅ Création automatique d'utilisateur s'il n'existe pas (rôle: citoyen)
- ✅ Connexion utilisateur existant
- ✅ Génération d'un JWT pour la session
- ✅ Mot de passe aléatoire pour les nouveaux utilisateurs

**Important**: 
- ⚠️ STUB actuellement - à intégrer avec Google Cloud API pour production
- Voir `TODO` dans le code pour l'intégration complète

---

## 🗄️ Migration BDD Créée

**Fichier**: `database/migrations/006_add_contact_messages.sql`

### Nouvelle Table: `signal_moi.contact_messages`

```sql
CREATE TABLE signal_moi.contact_messages (
    id UUID PRIMARY KEY,
    nom VARCHAR(255),
    email VARCHAR(255),
    telephone VARCHAR(20),
    sujet VARCHAR(255),
    message TEXT,
    statut VARCHAR(50) -- nouveau, en-cours, répondre, fermé
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    responded_at TIMESTAMP,
    notes TEXT
);
```

**Index**:
- `email` - Recherche par email
- `statut` - Filtrer par statut
- `created_at` - Tri chronologique

---

## 📋 Enregistrement des Routes

**Fichier modifié**: `backend/src/server.js`

```javascript
// Ajout des imports
const contactRoutes = require('./routes/contact.routes');

// Enregistrement
app.use('/api/contact', contactRoutes); // Formulaire de contact PUBLIQUE
```

---

## 🔐 Configuration Requise

### Pour l'email (contact.routes.js)
Variables d'environnement `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
```

### Pour Google OAuth (auth.routes.js)
À compléter:
```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

---

## 🚀 Déploiement

### Étape 1: Exécuter la migration
```bash
cd backend
node ../scripts/run_migrations_sql.js 006_add_contact_messages.sql
```

### Étape 2: Redémarrer le backend
```bash
npm run dev
```

### Étape 3: Tester les endpoints
```bash
# Test contact
curl -X POST http://localhost:3001/api/contact/send \
  -H "Content-Type: application/json" \
  -d '{"nom":"Test","email":"test@test.com","sujet":"Test","message":"Message test"}'

# Test Google OAuth
curl -X POST http://localhost:3001/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"test-token","email":"user@gmail.com","name":"Test User"}'
```

---

## 📞 Integration Frontend

### Contact Form
```javascript
// frontend/src/pages/contact.js
const handleSubmit = async (e) => {
  e.preventDefault();
  const response = await fetch('/api/contact/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nom: formData.nom,
      email: formData.email,
      telephone: formData.telephone,
      sujet: formData.sujet,
      message: formData.message
    })
  });
  const data = await response.json();
  if (data.success) {
    // Message envoyé avec succès
  }
};
```

### Google OAuth Login
```javascript
// frontend/src/pages/login.js
const handleGoogleLogin = async (response) => {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idToken: response.credential,
      email: response.email,
      name: response.name
    })
  });
  const data = await res.json();
  if (data.success) {
    localStorage.setItem('token', data.token);
    // Utilisateur connecté
  }
};
```

---

## ✅ Checklist

- [x] Route contact.routes.js créée
- [x] Route POST /api/contact/send créée
- [x] Route GET /api/contact/messages créée
- [x] Route POST /api/auth/google créée
- [x] Migration BDD 006 créée
- [x] Enregistrement dans server.js
- [x] Documentation complète
- [ ] Tests en production
- [ ] Intégration Google Cloud API (TODO)
- [ ] Configuration SMTP en production

---

## 📞 Support

Pour plus de détails:
- Voir `backend/src/routes/contact.routes.js`
- Voir `backend/src/routes/auth.routes.js`
- Voir `database/migrations/006_add_contact_messages.sql`
