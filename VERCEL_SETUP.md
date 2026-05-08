Checklist et configuration pour Vercel (frontend)

1) Créer le projet
- Importez le repo depuis GitHub → Framework: Next.js
- Build command: `npm run build`
- Output directory: (Next.js géré automatiquement)

2) Variables d'environnement (Project Settings → Environment Variables)
- NEXT_PUBLIC_API_URL = https://signal-moi-api.onrender.com/api
- NEXT_PUBLIC_SOCKET_URL = wss://signal-moi-api.onrender.com

3) Conseils
- Déployer une preview branch pour tester avant prod.
- Pour tester localement, créez un `.env.local` avec les mêmes clés (NE PAS committer `.env.local`).

4) Vérifications après déploiement
- Ouvrir la page publique (ex: https://<your-vercel-site>.vercel.app) et vérifier l'appel vers `NEXT_PUBLIC_API_URL` (ex: ouvrir la console réseau et vérifier requêtes vers `/api/*`).
- Vérifier la connexion socket (console logs du client indiquant `Socket connecté` si connecté).

Copier-coller exemple rapide (valeurs à remplacer):
- `NEXT_PUBLIC_API_URL` = https://signal-moi-api.onrender.com/api
- `NEXT_PUBLIC_SOCKET_URL` = wss://signal-moi-api.onrender.com

