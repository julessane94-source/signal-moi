# 🔒 Corrections de Confidentialité - Signalements

## Résumé des corrections apportées

### ✅ Problème 1: Accès non-filtré à tous les signalements
**Fichier**: `backend/src/routes/signalement.routes.js` (ligne 129)

**Avant**:
- N'importe quel utilisateur non-authentifié ou avec un rôle inconnu recevait TOUS les signalements

**Après**:
- ✅ **Citoyen** → voit seulement SES PROPRES signalements (`WHERE user_id = $1`)
- ✅ **Police** → voit seulement les signalements violence/vol
- ✅ **Admin** → voit tous les signalements (pour modération)
- ✅ **Autres** → accès refusé (erreur 403)

---

### ✅ Problème 2: Exposition d'informations personnelles en public
**Fichier**: `backend/src/routes/signalement.routes.js` (ligne 104)

**Avant**:
- La route `/public` exposait TOUS les signalements avec `user_id`

**Après**:
- ✅ Route `/public` affiche seulement les signalements anonymes
- ✅ Pas d'exposition du `user_id` ou infos personnelles

---

### ✅ Problème 3: Accès aux détails personnels d'un signalement
**Fichier**: `backend/src/routes/signalement.routes.js` (ligne 262)

**Avant**:
- N'importe qui pouvait voir: nom, prénom, email, téléphone via `GET /api/signalements/:id`

**Après**:
- ✅ Accès aux infos personnelles limité à:
  - Le propriétaire du signalement
  - Les administrateurs
  - La police
  - OU si le signalement est marqué comme anonyme

---

## Flux de sécurité final

```
Citoyen accède au dashboard
  ↓
  Fetch: GET /api/signalements (avec token)
  ↓
  Backend reçoit le role 'citoyen'
  ↓
  Retourne SEULEMENT les signalements où user_id = [ID du citoyen]
  ↓
  ✅ Citoyen ne voit que ses propres signalements
```

---

## Cas d'usage validés

| Cas | Avant | Après |
|-----|-------|-------|
| Citoyen A voit ses signalements | ❓ Tous les signalements | ✅ Ses propres signalements |
| Citoyen A voit signalements Citoyen B | ❌ Tous les détails exposés | ✅ Accès refusé |
| Publique accède `/api/signalements/public` | ❌ Tous + user_id exposé | ✅ Seulement anonymes, pas d'ID |
| Police voit détails signalement | ✅ Voir | ✅ Voir (police) |
| Admin voit tous les signalements | ✅ Voir | ✅ Voir (admin uniquement) |

---

## Notes importantes

- 🔐 Le champ `est_anonyme` est crucial pour la logique de confidentialité
- 📱 Assurez-vous que le champ existe dans votre schéma PostgreSQL
- 🔑 Vérifiez que les tokens JWT contiennent le `role` correct
- 📝 Testez les 3 routes GET corrigées avec différents profils

---

## Testing recommandé

```bash
# Tester en tant que citoyen
curl -H "Authorization: Bearer [TOKEN_CITOYEN]" \
  http://localhost:3000/api/signalements
# → Doit retourner seulement ses signalements

# Tester en tant que police
curl -H "Authorization: Bearer [TOKEN_POLICE]" \
  http://localhost:3000/api/signalements
# → Doit retourner seulement violence/vol

# Tester accès public (anonyme)
curl http://localhost:3000/api/signalements/public
# → Doit retourner seulement signalements anonymes, SANS user_id

# Tester détails signalement d'un autre
curl -H "Authorization: Bearer [TOKEN_CITOYEN_A]" \
  http://localhost:3000/api/signalements/[ID_CITOYEN_B]
# → Doit retourner 403 si non-anonyme
```
