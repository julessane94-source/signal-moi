# ✨ Fonctionnalité: Changement du Logo par l'Admin

## 📋 Description
Les administrateurs peuvent maintenant changer le logo du site via un bouton "Paramètres" dans le tableau de bord admin.

## 🔄 Changements apportés

### Backend (`backend/src/`)

#### 1. Routes Admin (`routes/admin.routes.js`)
- ✅ Ajouté imports: `multer`, `path`, `uuid`, `fs`
- ✅ Configuré storage multer pour les logos avec destination `/uploads/logos`
- ✅ Créé middleware `uploadLogo` avec validation des types (JPEG, PNG, WebP, GIF)
- ✅ Implémenté endpoint `PUT /api/admin/site-config/logo`:
  - Récupère le fichier logo uploadé
  - Valide le type et la taille (max 5MB)
  - Sauvegarde dans `/uploads/logos/`
  - Enregistre le chemin dans la base de données (table `site_config`)
  - Retourne `logoUrl` au frontend

#### 2. Configuration Serveur (`src/server.js`)
- ✅ Ajouté `logos` à la liste des répertoires obligatoires (`requiredDirs`)
- Les fichiers sont servies statiquement via `/uploads` route

### Frontend (`frontend/src/`)

#### 1. Dashboard Admin (`pages/admin/dashboard.js`)
- ✅ Ajouté icone `ArrowUpTrayIcon` pour l'upload
- ✅ Ajouté state variables:
  - `logoUrl`: URL du logo actuel
  - `uploadingLogo`: statut du téléchargement
- ✅ Implémenté fonction `handleLogoUpload`:
  - Valide le type de fichier (JPEG, PNG, WebP, GIF)
  - Valide la taille (max 5MB)
  - Upload via `PUT /api/admin/site-config/logo`
  - Met à jour l'UI avec succès/erreur
- ✅ Mis à jour `fetchSiteConfig` pour charger le logo actuel
- ✅ Ajouté nouvel onglet "Paramètres" avec icone `CogIcon`
- ✅ Créé interface complète pour:
  - Afficher l'aperçu du logo actuel
  - Upload d'un nouveau logo (drag-and-drop compatible)
  - Affichage du statut d'upload
  - Formulaire additionnels (nom du site, boutons réinitialiser)

## 📂 Structure des fichiers

```
backend/
├── src/
│   ├── routes/admin.routes.js (modifié)
│   └── server.js (modifié)
└── uploads/
    └── logos/ (nouveau dossier)

frontend/
└── src/
    └── pages/admin/dashboard.js (modifié)
```

## 🔐 Sécurité

- ✅ Authentification requise (`authMiddleware`)
- ✅ Validation du type de fichier (liste blanche)
- ✅ Limite de taille: 5MB
- ✅ Noms de fichiers uniques avec UUID
- ✅ Suppression des fichiers échoués

## 🧪 Test manuel

### Pour tester la fonctionnalité:

1. **Accéder au dashboard admin**
   ```
   http://localhost:3000/admin/dashboard
   ```

2. **Cliquer sur l'onglet "Paramètres"**

3. **Dans la section "Gestion du Logo"**
   - Voir l'aperçu du logo actuel
   - Cliquer sur la zone d'upload
   - Sélectionner une image (JPEG, PNG, WebP, GIF)
   - Attendre la confirmation de succès

4. **Vérifier que le logo est mis à jour**
   - La navbar affichera le nouveau logo
   - Le logo change sur toutes les pages

## 📱 API Endpoint

### `PUT /api/admin/site-config/logo`

**Authentification:** ✅ Requise (Bearer Token)

**Body:** Form-data
```
- logo: [image file] (JPEG, PNG, WebP, GIF, max 5MB)
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Logo changé avec succès",
  "logoUrl": "/uploads/logos/logo-uuid.png"
}
```

**Response Error (400/500):**
```json
{
  "error": "Message d'erreur",
  "details": "..."
}
```

## 🔄 Intégration avec le site

Le logo est automatiquement chargé et affiché dans:
- ✅ Navbar (tous les utilisateurs)
- ✅ Le endpoint public `/api/auth/site-config` retourne `logoUrl`

## 📝 Notes

- Le logo par défaut est `/icons/icon-192x192.png`
- Les anciens logos ne sont pas supprimés (ils restent dans `/uploads/logos/`)
- La configuration est stockée dans la table `site_config` avec la clé `logoUrl`

## 🚀 Déploiement

Assurez-vous que:
1. Le répertoire `/backend/uploads/logos/` existe et est accessible en écriture
2. Les permissions nginx/apache permettent l'accès aux fichiers statiques dans `/uploads`
3. La variable d'environnement `API_BASE` est correctement configurée au frontend

## ✅ Checklist de déploiement

- [ ] Tester le upload localement
- [ ] Vérifier que les fichiers sont servies correctement
- [ ] Vérifier les permissions des dossiers
- [ ] Tester sur le serveur de production
- [ ] Vérifier que la navbar affiche le nouveau logo sur tous les appareils
