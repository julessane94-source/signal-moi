# Guide de Test - Dashboard Collaborateur

## 🎯 Objectif
Vérifier que tous les boutons du dashboard collaborateur fonctionnent correctement.

## 🔍 Checklist des Boutons

### 1. Bouton "Contacter la victime"
- **Localisation**: Carte des signalements assignés, chaque signalement
- **Action attendue**: Ouvre client email (mailto:)
- **Test**:
  - [ ] Cliquer le bouton
  - [ ] Vérifier que le client email s'ouvre
  - [ ] Confirmez que l'email de la victime est pré-rempli
- **Erreurs potentielles**:
  - "Email non disponible" → l'auteur (victime) n'a pas d'email enregistré

---

### 2. Bouton "Suivre dossier"
- **Localisation**: Carte des signalements assignés, chaque signalement
- **Action attendue**: Ajoute/retire le dossier à la liste "Dossiers suivis"
- **Test**:
  - [ ] Cliquer le bouton "Suivre dossier"
  - [ ] Vérifier que le bouton devient "Suivi" (vert)
  - [ ] Vérifier que le dossier apparaît dans "Dossiers suivis"
  - [ ] Inspecteur réseau: POST /api/collaborator/follow (statut 200)
  - [ ] Cliquer le bouton "Suivi" (vider le suivi)
  - [ ] Vérifier que le bouton redevient "Suivre dossier"
  - [ ] Vérifier que le dossier disparaît de "Dossiers suivis"
  - [ ] Inspecteur réseau: DELETE /api/collaborator/follow/:id (statut 200)
- **Erreurs potentielles**:
  - Erreur 401 → token JWT manquant/invalide
  - Erreur 403 → rôle utilisateur n'est pas 'collaborateur'
  - Erreur 500 → table `signal_moi.followed_cases` n'existe pas (migration non exécutée)

---

### 3. Bouton "Exporter PDF"
- **Localisation**: Haut du dashboard (section actions rapides)
- **Action attendue**: Télécharge PDF des dossiers suivis
- **Test**:
  - [ ] Cliquer le bouton "Export PDF"
  - [ ] Vérifier que le fichier "dossiers_suivis.pdf" se télécharge
  - [ ] Ouvrir le PDF et vérifier que le contenu est valide
  - [ ] Inspecteur réseau: GET /api/collaborator/export/cases?format=pdf (statut 200)
- **Erreurs potentielles**:
  - Erreur 401 → token JWT manquant/invalide
  - Erreur 500 → dépendance `pdfkit` non installée

---

### 4. Bouton "Exporter Excel"
- **Localisation**: Haut du dashboard (section actions rapides)
- **Action attendue**: Télécharge Excel (.xlsx) des dossiers suivis
- **Test**:
  - [ ] Cliquer le bouton "Export Excel"
  - [ ] Vérifier que le fichier "dossiers_suivis.xlsx" se télécharge
  - [ ] Ouvrir le fichier avec Excel/Sheets et vérifier le contenu
  - [ ] Inspecteur réseau: GET /api/collaborator/export/cases?format=excel (statut 200)
- **Erreurs potentielles**:
  - Erreur 401 → token JWT manquant/invalide
  - Erreur 500 → dépendance `exceljs` non installée

---

### 5. Bouton "Créer campagne"
- **Localisation**: Haut du dashboard (section actions rapides)
- **Action attendue**: Navigue vers page `/collaborator/campagne/new`
- **Test**:
  - [ ] Cliquer le bouton "Créer campagne"
  - [ ] Vérifier que l'URL change vers `/collaborator/campagne/new`
  - [ ] Vérifier que le formulaire de création s'affiche

---

### 6. Bouton "Statistiques"
- **Localisation**: Haut du dashboard (section actions rapides)
- **Action attendue**: Affiche un message "non implémentées" (toast)
- **Test**:
  - [ ] Cliquer le bouton "Statistiques"
  - [ ] Vérifier que le toast "Statistiques non implémentées dans cette vue" apparaît

---

### 7. Bouton "Détails"
- **Localisation**: Carte des signalements assignés, chaque signalement
- **Action attendue**: Navigue vers `/citizen/signalement/:id`
- **Test**:
  - [ ] Cliquer le bouton "Détails"
  - [ ] Vérifier que l'URL change vers `/citizen/signalement/{id}`
  - [ ] Vérifier que la page détail se charge

---

### 8. Bouton "Ne plus suivre"
- **Localisation**: Section "Dossiers suivis", chaque dossier suivi
- **Action attendue**: Retire le dossier de la liste "Dossiers suivis"
- **Test**:
  - [ ] Cliquer le bouton "Ne plus suivre"
  - [ ] Vérifier que le dossier disparaît de la liste
  - [ ] Inspecteur réseau: DELETE /api/collaborator/follow/:id (statut 200)

---

### 9. Bouton "Voir"
- **Localisation**: Section "Dossiers suivis", chaque dossier suivi
- **Action attendue**: Navigue vers `/citizen/signalement/:id`
- **Test**:
  - [ ] Cliquer le bouton "Voir"
  - [ ] Vérifier que l'URL change vers `/citizen/signalement/{id}`

---

## 🔧 Dépannage

### Si un bouton ne fonctionne pas:
1. **Ouvrir Inspecteur Réseau** (F12 → Network)
2. **Cliquer le bouton** et observer la requête
3. **Vérifier le statut HTTP**:
   - 200/201 ✓ OK
   - 400 ✗ Données manquantes/invalides
   - 401 ✗ Authentification requise (token manquant/expiré)
   - 403 ✗ Accès refusé (rôle utilisateur incorrect)
   - 404 ✗ Endpoint n'existe pas
   - 500 ✗ Erreur serveur (vérifier logs backend)
4. **Vérifier la Console** (F12 → Console) pour les erreurs JavaScript
5. **Vérifier les logs backend**: `npm run dev` (Render.com → Logs ou local)

### Erreurs courantes:
| Erreur | Cause | Solution |
|--------|-------|----------|
| 401 Unauthorized | Token JWT expiré/manquant | Se reconnecter |
| 403 Forbidden | Rôle ≠ 'collaborateur' | Vérifier role dans DB: `SELECT role FROM signal_moi.users WHERE email = 'save@gmail.com'` |
| 500 Internal Server Error | Table `followed_cases` n'existe pas | Exécuter migration: `node scripts/run_sql_file.js "<DB_URL>" database/migrations/004_add_followed_cases.sql` |
| 500 Internal Server Error | Dépendance manquante (`pdfkit`, `exceljs`) | Backend: `npm install` |

---

## 📊 Cas de Test Spécifiques

### Cas 1: Suivi + Notification Realtime
1. Ouvrir navigateur A: collaborator connecté
2. Ouvrir navigateur B: police connecté
3. Dans A: Cliquer "Suivre dossier" sur un signalement
4. Dans B: Changer le statut du dossier via endpoint police
5. Dans A: Vérifier que la notification apparaît (toast + mise à jour liste)

### Cas 2: Export PDF/Excel
1. Suivre 3+ dossiers
2. Cliquer "Export PDF" → vérifier le PDF contient les 3+ dossiers
3. Cliquer "Export Excel" → vérifier le fichier .xlsx a les bonnes colonnes

### Cas 3: Token Expiré
1. Se connecter
2. Attendre 24h (OU forcer expiration du token en dev)
3. Cliquer un bouton → doit être redirigé vers `/login`

---

## 🚀 Exécution Automatisée

Utiliser le script Playwright fourni pour tester automatiquement:
```bash
cd signal-moi
npm install -D playwright
npx playwright install

$env:COLLABORATOR_EMAIL='save@gmail.com'
$env:COLLABORATOR_PASSWORD='Baye1994@'
$env:BASE_URL='https://signal-moi.vercel.app'
node tests/collaborator.spec.js
```
