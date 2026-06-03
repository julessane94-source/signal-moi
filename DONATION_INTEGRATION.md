# 🎁 Page de Donation - Integration Guide

## 📄 Pages Créées

### 1. Page de Donation (`frontend/src/pages/donate.js`)
Une page complète dédiée au financement du projet avec :
- **Titre d'introduction** avec appel à l'action
- **Plusieurs moyens de donation** :
  - PayPal
  - Wave (transfert d'argent)
  - Orange Money (Sénégal)
  - Virement bancaire
  - Chèques postaux
- **Montants suggérés** (5000, 10000, 25000, 50000, 100000 FCFA)
- **Section FAQ** expliquant l'usage des dons
- **Design moderne** avec animations Framer Motion

URL: `/donate`

### 2. Composant DonateButton (`frontend/src/components/DonateButton.js`)
Bouton de donation réutilisable à mettre partout sur le site.

### 3. Composant Footer (`frontend/src/components/Footer.js`)
Footer complet avec :
- Navigation rapide
- Liens légaux (Confidentialité, Conditions, Cookies)
- Informations de contact
- **Banneau de donation** explicite
- Liens réseaux sociaux

---

## 🔗 Coordonnées de Réception

Les dons sont reçus par :
- **Numéro de téléphone** : +221 778 851 691 (Wave, Orange Money)
- **Email** : julessane94@gmail.com (Virement, PayPal, Chèques postaux)
- **PayPal** : https://paypal.me/julessane94

---

## 📦 Comment Intégrer dans les Pages Existantes

### Option 1 : Ajouter le bouton de donation simple
Dans n'importe quelle page, importez et utilisez le DonateButton :

```jsx
import DonateButton from '../components/DonateButton';

export default function MyPage() {
  return (
    <div>
      {/* ... contenu de la page ... */}
      <div className="flex justify-center mt-8">
        <DonateButton />
      </div>
    </div>
  );
}
```

### Option 2 : Ajouter le Footer complet
Pour ajouter le footer à chaque page :

```jsx
import Footer from '../components/Footer';

export default function MyPage() {
  return (
    <>
      <main>
        {/* ... contenu de la page ... */}
      </main>
      <Footer />
    </>
  );
}
```

### Option 3 : Ajouter un bouton de donation dans un Menu/Header
```jsx
import Link from 'next/link';
import { HeartIcon } from '@heroicons/react/24/outline';

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      {/* ... autres éléments ... */}
      <Link href="/donate">
        <a className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          <HeartIcon className="w-5 h-5" />
          Donner
        </a>
      </Link>
    </header>
  );
}
```

---

## 🎨 Personnalisation

### Changer les couleurs du gradient
La page utilise `from-red-600 to-pink-600`. Vous pouvez changer dans `donate.js`:

```jsx
// Ligne 16
className="relative overflow-hidden bg-gradient-to-br from-COULEUR1 via-COULEUR2 to-COULEUR3 py-20"
```

Couleurs disponibles Tailwind :
- `from-indigo-600 to-purple-600`
- `from-green-600 to-emerald-600`
- `from-blue-600 to-cyan-600`

### Ajouter d'autres moyens de paiement
Modifiez l'array `donationOptions` dans `donate.js` :

```jsx
const donationOptions = [
  {
    name: 'Votre Moyen',
    description: 'Description du moyen',
    url: 'https://votre-lien.com',
    color: 'from-COULEUR1 to-COULEUR2',
    icon: '🎁',
  },
  // ...
];
```

---

## ✅ Checklist d'Implémentation

- [ ] Page `/donate` créée et accessible
- [ ] Composant `DonateButton` intégré dans le menu/header
- [ ] Composant `Footer` ajouté aux pages principales
- [ ] Vérifier les liens vers PayPal, Wave, Orange Money
- [ ] Tester le copier-coller des coordonnées de contact
- [ ] Personnaliser les couleurs si nécessaire
- [ ] Ajouter les liens réseaux sociaux dans le Footer

---

## 📊 Statistiques d'Intégration

- **Nombre de fichiers créés** : 3
- **Composants réutilisables** : 2 (DonateButton, Footer)
- **Pages dédiées** : 1 (/donate)
- **Moyens de paiement supportés** : 5+

---

## 🚀 Prochaines Étapes

1. **Ajouter un système de tracking des dons** (optionnel)
2. **Créer une page de remerciement** pour les donateurs
3. **Implémenter des emails de confirmation** de donation
4. **Ajouter des statistiques** de dons collectés
5. **Intégrer avec Stripe/Square** pour plus de moyens de paiement

---

## 📞 Support

Pour toute question sur l'intégration :
- Email : julessane94@gmail.com
- Téléphone : +221 778 851 691
