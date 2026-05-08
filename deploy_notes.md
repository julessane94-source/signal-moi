Déploiement — notes rapides
===========================

But: déployer le frontend sur Vercel et le backend (Docker) sur Render.

Prérequis
- Repo accessible depuis Vercel / Render (GitHub/GitLab/Bitbucket).
- Variables d'environnement prêtes (voir ci-dessous).
- Bucket S3 (ou équivalent) pour les uploads en production.

Variables essentielles (backend)
- `DATABASE_URL` (ex: postgres://user:pass@host:5432/dbname)
- `JWT_SECRET`
- `FRONTEND_URL` (ex: https://mon-site.vercel.app)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Stockage fichiers (si `USE_S3=true`): `USE_S3`, `S3_BUCKET`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `PORT` (Render override possible)

Étapes Render (backend)
1. Créez une Postgres Database sur Render — récupérez la `DATABASE_URL`.
2. Créez un Web Service et pointez sur `backend/Dockerfile` (env: Docker).
   - Start command: `npm start` (Dockerfile actuel expose `5000`).
3. Dans Settings du service ajoutez les env vars listées ci-dessus.
4. (Optionnel) Configurez un Object Storage (S3) et ajoutez les clefs en env.
5. Exécutez le job `run-migrations` (Jobs → `run-migrations`) pour créer les tables.

Étapes Vercel (frontend)
1. Importez le repo et créez le projet Next.js.
2. Dans Project Settings → Environment Variables ajoutez:
   - `NEXT_PUBLIC_API_URL` = `https://<YOUR_RENDER_BACKEND_URL>/api`
   - `NEXT_PUBLIC_SOCKET_URL` = `wss://<YOUR_RENDER_BACKEND_URL>` (si websockets)
3. Déployez; vérifiez les previews.

Tests & vérifications
- Health: GET `https://<BACKEND>/api/health` doit retourner `{status:'OK'}`.
- WebSocket: testez la connexion `socket.io` côté client avec l'URL publique.
- Uploads: envoyez via l'interface de test un fichier et vérifiez qu'il va bien dans S3 (ou `uploads/` local si `USE_S3=false`).

Exemple: route de test d'upload
- Endpoint ajouté: `POST /api/test/upload` (champ form `file`).
- Exemple cURL (script `upload_test.sh` à la racine du repo):

```bash
./upload_test.sh /chemin/vers/photo.jpg
```

La réponse contient `url` pointant vers S3 (ou vers `uploads/` local).

Commande utile locale
```powershell
# synchroniser les modèles (migrations)
$env:DATABASE_URL="postgres://user:pass@host:5432/dbname"
cd backend
npm run migrate
```

Notes
- Render: le filesystem est éphémère — n'utiliser que S3 pour uploads persistants.
- Vercel: privilégiez `NEXT_PUBLIC_API_URL` plutôt que les rewrites si vous voulez séparer les projets.
- Sécurité: ne commitez jamais de secrets; utilisez les settings de projet pour stocker les env.
