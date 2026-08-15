# Signal Moi Mobile

Sous-application mobile Expo/React Native pour reprendre les acquis de la plateforme Signal Moi:

- connexion avec les comptes existants;
- inscription citoyen et recuperation de mot de passe;
- localisation GPS reelle avec permission systeme;
- creation de signalement citoyen avec type rapide, description et preuves;
- inscription aux campagnes;
- espace police mobile avec signalements, lives camera en temps reel et notifications sonores;
- espace collaborateur avec dossiers et statistiques;
- espace admin avec supervision et configuration;
- chatbot SUPERMAN integre;
- connexion Google mobile;
- dons Wave et Orange Money configurable;
- connexion au backend existant via `/api`;
- connexion Socket.IO au serveur existant pour les alertes et lives.

## Lancement local

```bash
cd mobile
cp .env.example .env
npm install
npm run start
```

## Obtenir un APK Android

```bash
cd mobile
npm install
npx expo install --fix
npm install --global eas-cli
eas login
eas build -p android --profile preview
```

Le profil `preview` genere un APK installable directement sur Android. Les variables Render sont deja renseignees dans `eas.json`.

## Si l'application ne s'ouvre pas

1. Desinstallez l'ancien APK du telephone.
2. Relancez `npm install` dans `mobile`.
3. Relancez `npx expo install --fix` pour aligner les modules natifs avec SDK 54.
4. Reconstruisez avec `eas build -p android --profile preview`.
5. Installez le nouvel APK.

Un APK deja installe ne connait pas les modules natifs ajoutes apres coup. Il faut donc reconstruire l'application apres l'ajout de Google, fichiers, partage, camera et notifications.

Pour tester directement avec le backend Render actuel de Signal Moi:

```env
EXPO_PUBLIC_API_URL=https://signal-moi-api.onrender.com/api
EXPO_PUBLIC_SOCKET_URL=https://signal-moi-api.onrender.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=912214570168-31s5lpn11tak5kfp3arplc0sbrq0vh1v.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_ORANGE_MONEY_URL=
```

Le client ID ci-dessus est un client Web. Pour activer le bouton Google sur Android, il faut creer un client OAuth Android separe dans Google Cloud avec:

- package Android: `sn.signalmoi.mobile`;
- empreinte SHA-1 de la cle utilisee pour le build Android;
- puis renseigner `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`.

Ne copiez pas le client Web dans `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`: Google peut refuser la connexion car le type de client OAuth n'est pas le meme.

Si `signal-moi.sn` pointe deja vers le backend API, vous pouvez aussi utiliser:

```env
EXPO_PUBLIC_API_URL=https://signal-moi.sn/api
EXPO_PUBLIC_SOCKET_URL=https://signal-moi.sn
```

Pour tester avec le backend local, utilisez l'adresse IP de votre ordinateur sur le meme Wi-Fi:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.20:5000/api
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.20:5000
```

## Structure

```text
mobile/
  App.js
  app.config.js
  src/
    config/env.js
    context/AuthContext.js
    context/LocationContext.js
    services/api.js
    services/liveSocket.js
    screens/Auth/LoginScreen.js
    screens/Citizen/CitizenHomeScreen.js
    screens/Citizen/CreateSignalementScreen.js
    screens/Police/PoliceDashboardScreen.js
```

## Points deja prepares

Le mobile demande automatiquement la localisation au demarrage. Les signalements envoyes contiennent la latitude et la longitude precise si l'utilisateur autorise le GPS.

L'application mobile ne doit pas se connecter directement a PostgreSQL. Elle appelle le backend Render, puis le backend lit et ecrit dans la base Render avec `DATABASE_URL`. C'est plus securise et compatible avec les comptes, roles, signalements, lives, statistiques et notifications existants.

## Acquis Vercel portes dans le mobile

- Authentification: connexion, inscription citoyen, mot de passe oublie.
- Role utilisateur: affichage different pour citoyen, police, collaborateur et admin.
- Citoyen: accueil, GPS, signalement simplifie, preuves, campagnes, live.
- Live mobile: camera native, envoi de frames regulieres vers Render et Socket.IO police.
- Police: fil d'intervention, live en temps reel, notifications sonores locales.
- Collaborateur: dossiers suivis, acces statistiques et campagnes.
- Admin: vrais chiffres depuis `/admin/users`, `/admin/campagnes`, `/admin/signalements` et statistiques Render.
- Contact victime: appel, SMS, WhatsApp, email et localisation pour police, collaborateur et admin.
- SUPERMAN: assistant Signal Moi avec connaissances integrees.
- Google: connexion mobile preparee avec `expo-auth-session`.
- Paiements: Wave fonctionnel via lien marchand, Orange Money configurable par `EXPO_PUBLIC_ORANGE_MONEY_URL` ou route backend.
- Exports: telechargement PDF/Excel depuis Render avec partage mobile.
- Backend: appels directs vers `https://signal-moi-api.onrender.com/api`.

Le tableau police ecoute les evenements Socket.IO suivants, afin de rester compatible avec les noms deja utilises cote web/backend:

- `new_signalement`
- `signalement:new`
- `live_session_started`
- `live:started`

## Prochaines etapes conseillees

1. Installer les dependances dans `mobile`.
2. Tester la connexion avec un compte citoyen et un compte police existants.
3. Creer les client IDs Google Android/iOS dans Google Cloud et les placer dans EAS.
4. Ajouter Orange Money marchand/API lorsque le compte marchand sera disponible.
5. Si Orange Money utilise une API secrete, creer une route backend Render et ne jamais mettre le secret dans l'application mobile.
