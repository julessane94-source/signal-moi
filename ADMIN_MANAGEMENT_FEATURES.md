# Fix: Boutons de suppression admin et onglet Campagnes

## Problèmes Identifiés et Résolus

### 1. **Bouton de suppression signalement invisible** ❌ → ✅

**Problème Root Cause:**
- L'onglet 'signalements' affichait les cartes sans boutons de suppression
- Aucune interaction possible pour l'admin pour modérer le contenu
- Les fonctions deleteSignalement n'existaient pas

**Solution Appliquée:**
- Fichier: `frontend/src/pages/admin/dashboard.js`
- Ajout d'un bouton trash icon rouge 🗑️ pour chaque signalement
- Placement: Coin inférieur droit de chaque carte
- Fonction: Ouvre un modal de confirmation avec raison de suppression
- API: DELETE `/api/admin/signalements/:id` avec raison en body

**Détails Technique:**
```javascript
// Bouton ajouté
<motion.button
  whileHover={{ scale: 1.05 }}
  onClick={() => {
    setItemToDelete(s.id)
    setDeleteType('signalement')
    setDeleteReason('')
  }}
  className="p-2 hover:bg-red-50 rounded-lg transition"
  title="Supprimer ce signalement"
>
  <TrashIcon className="h-5 w-5 text-red-600" />
</motion.button>
```

**Impact:**
- ✅ Admin peut maintenant supprimer les signalements directement
- ✅ Les utilisateurs reçoivent une notification avec raison
- ✅ La suppression rafraîchit la liste

### 2. **Admin ne voit pas les campagnes** ❌ → ✅

**Problème Root Cause:**
- Les campagnes étaient chargées via l'API mais jamais stockées en état (useState)
- Pas d'onglet 'campagnes' dans la navigation
- Variable `campagnes` n'existait pas

**Solution Appliquée:**

#### a) État pour stocker les campagnes
```javascript
const [campagnes, setCampagnes] = useState([])
```

#### b) Charger les campagnes dans fetchStats
```javascript
const campagnesData = campagnesRes.ok ? await campagnesRes.json() : []
setCampagnes(Array.isArray(campagnesData) ? campagnesData : [])
```

#### c) Ajouter l'onglet 'Campagnes' à la navigation
```javascript
{ id: 'campagnes', label: 'Campagnes', icon: ChartBarIcon }
```

#### d) Afficher les campagnes avec boutons de suppression
- Même layout que les signalements
- Affichage du titre, description, date de création, créateur
- Bouton de suppression rouge avec modal de confirmation

**Détails Technique:**
- API: GET `/api/campagnes` pour charger
- API: DELETE `/api/admin/campagnes/:id` pour supprimer
- Notification: Tous les inscrits reçoivent un email

**Impact:**
- ✅ Admin voit l'onglet 'Campagnes' dans le dashboard
- ✅ Liste complète des campagnes affichée
- ✅ Admin peut supprimer les campagnes
- ✅ Les participants reçoivent des notifications

### 3. **Modal de Confirmation de Suppression** ✨

**Nouvelles Fonctionnalités:**
1. **States ajoutés:**
   - `itemToDelete`: ID de l'item à supprimer
   - `deleteType`: 'signalement' ou 'campagne'
   - `deleteReason`: Texte libre pour expliquer pourquoi

2. **Modal réutilisable:**
   - Titre dynamique selon le type
   - Message contextuel en français
   - Textarea pour la raison (optionnel)
   - Boutons Annuler et Supprimer

3. **Fonctions de suppression:**
   - `deleteSignalement()`: Supprime et notifie l'auteur
   - `deleteCampagne()`: Supprime et notifie les participants
   - Toast de succès: "✅ Signalement supprimé et notification envoyée"

## Fichiers Modifiés

1. **frontend/src/pages/admin/dashboard.js** (179 insertions)
   - Lignes 22-26: Ajout états pour suppression
   - Lignes 128: setCampagnes dans fetchStats
   - Lignes 230-281: Fonctions deleteSignalement et deleteCampagne
   - Lignes 388: Onglet 'Campagnes' ajouté
   - Lignes 555-650: Section Signalements avec boutons
   - Lignes 652-710: Section Campagnes avec boutons
   - Lignes 912-950: Modal de confirmation

## Endpoints Utilisés

### Suppression Signalement
```
DELETE /api/admin/signalements/:id
Body: { reason: "..." }
Response: { success: true, message: "..." }
```

### Suppression Campagne
```
DELETE /api/admin/campagnes/:id
Body: { reason: "..." }
Response: { success: true, message: "...", notificationsSent: number }
```

### Charger Signalements
```
GET /api/admin/signalements
Response: [{ id, titre, description, localisation, statut, fichiers, author, ... }]
```

### Charger Campagnes
```
GET /api/campagnes
Response: [{ id, titre, description, image, createur, created_at, ... }]
```

## Tests Recommandés

- [ ] Ouvrir le dashboard admin
- [ ] Aller à l'onglet 'Signalements'
- [ ] Vérifier que les boutons 🗑️ sont visibles
- [ ] Cliquer sur un bouton → modal de confirmation
- [ ] Ajouter une raison et cliquer "Supprimer"
- [ ] Vérifier notification envoyée à l'auteur
- [ ] Aller à l'onglet 'Campagnes'
- [ ] Vérifier que les campagnes sont affichées
- [ ] Vérifier que les boutons 🗑️ sont visibles
- [ ] Supprimer une campagne et vérifier notifications

## Prochaines Étapes

- Tester en production sur Render.com
- Valider les endpoints API pour suppression
- Vérifier les emails de notification sont bien envoyés
- Considérer soft-delete au lieu de hard-delete (pour audit)
- Ajouter un historique des suppressions (admin log)
