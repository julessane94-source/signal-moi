# Correction - Images de Preuve pour Signalements

## 🔧 Problème Résolu

**Erreur**: `column "images" of relation "signalements" does not exist`

**Cause**: Le code tentait d'insérer des images dans une colonne JSON qui n'existe pas dans la table `signalements`.

## ✅ Solution Implémentée

### Approche: Utiliser la table `fichiers` séparée

Au lieu d'avoir une colonne JSON `images` directement dans `signalements`, les images/preuves sont stockées dans la table `fichiers` avec:
- Références au signalement via `signalement_id`
- Type de fichier (image, vidéo, audio, document)
- Chemin d'accès complet
- Métadonnées (taille, mime_type, date création)

### Modifications dans `signalement.routes.js`

#### 1. **POST /api/signalements** (Création)
```javascript
// ❌ AVANT
INSERT INTO signal_moi.signalements (user_id, titre, ..., images)
VALUES ($1, $2, ..., '[]')

// ✅ APRÈS  
INSERT INTO signal_moi.signalements (user_id, titre, ...)
VALUES ($1, $2, ...)
// Les fichiers sont insérés séparément dans signal_moi.fichiers
```

#### 2. **GET /:id** (Détail du signalement)
```javascript
// ❌ AVANT
SELECT s.images...
images: JSON.parse(signalement.images)

// ✅ APRÈS
// Récupère les fichiers depuis la table fichiers
fichiers: [
  {
    id: "uuid",
    nom: "photo1.jpg",
    url: "http://localhost:3001/uploads/signalements/...",
    type: "image",
    mimeType: "image/jpeg",
    taille: 1024,
    createdAt: "2026-05-27T..."
  }
]
```

## 📊 Structure des Données

### Table `signalements` (simplifié)
```sql
CREATE TABLE signal_moi.signalements (
  id UUID PRIMARY KEY,
  user_id UUID,
  titre VARCHAR,
  description TEXT,
  type VARCHAR,
  localisation VARCHAR,
  latitude NUMERIC,
  longitude NUMERIC,
  -- ❌ PLUS de colonne images!
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Table `fichiers` (pour les images/preuves)
```sql
CREATE TABLE signal_moi.fichiers (
  id UUID PRIMARY KEY,
  signalement_id UUID REFERENCES signalements(id),
  nom_fichier VARCHAR,
  chemin VARCHAR,           -- Path: uploads/signalements/file.jpg
  type VARCHAR,             -- 'image', 'video', 'audio', 'document'
  taille INTEGER,           -- Bytes
  mime_type VARCHAR,        -- image/jpeg, video/mp4, etc
  description TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP
);
```

## 🎯 Avantages

| Aspect | Bénéfice |
|--------|----------|
| **Scalabilité** | Illimité de fichiers par signalement |
| **Performance** | Requête ciblée pour fichiers seulement |
| **Métadonnées** | Chaque fichier a ses propres métadonnées |
| **Flexibilité** | Support de tous types de fichiers |
| **URLs directes** | `fichiers[0].url` pour afficher l'image |

## 🖼️ Affichage des Images en Frontend

### React Component
```javascript
const signalement = await fetch(`/api/signalements/${id}`).then(r => r.json());

// Les images sont dans signalement.fichiers
{signalement.fichiers.map(file => {
  if (file.type === 'image') {
    return <img src={file.url} alt={file.nom} />;
  }
})}
```

### Response JSON du GET /:id
```json
{
  "id": "uuid",
  "titre": "Insalubrité",
  "description": "Dans mon quartier",
  "type": "citoyenne",
  "fichiers": [
    {
      "id": "uuid-1",
      "nom": "photo_insalubrite.jpg",
      "url": "http://localhost:3001/uploads/signalements/photo_insalubrite.jpg",
      "type": "image",
      "mimeType": "image/jpeg",
      "taille": 2048000,
      "createdAt": "2026-05-27T08:20:37Z"
    }
  ]
}
```

## ⚠️ Points Importants

1. **Pas de migration nécessaire** - La colonne `images` n'existait pas vraiment
2. **Les fichiers déjà uploadés** - Vérifier s'il y en a dans la table `fichiers` (faire un SELECT)
3. **Affichage des preuves** - Utiliser `fichiers[i].url` pour afficher les images au frontend
4. **Upload de fichiers** - Le middleware `uploadMultiple` crée automatiquement les entrées dans `fichiers`

## 🚀 Tests

### Créer un signalement avec image (FormData)
```javascript
const form = new FormData();
form.append('titre', 'Insalubrité');
form.append('description', 'Description');
form.append('type', 'citoyenne');
form.append('localisation', 'Sedhiou');
form.append('fichiers', fileInput.files[0]); // Le fichier image

fetch('/api/signalements', {
  method: 'POST',
  headers: { Authorization: 'Bearer token' },
  body: form
});
```

### Récupérer le signalement avec ses images
```javascript
const sig = await fetch('/api/signalements/uuid').then(r => r.json());
console.log(sig.fichiers); // Array d'images/vidéos/documents
```
