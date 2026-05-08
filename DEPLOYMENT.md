Déploiement: Vercel (frontend) et Render (backend + DB)
=====================================================

Résumé rapide
- Frontend Next.js -> Vercel
- Backend Node/Express (Docker) -> Render Web Service
- Base de données -> Render Postgres (ou autre DB via DATABASE_URL)

Variables d'environnement essentielles (backend)
- `DATABASE_URL` ou `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`, `DB_DIALECT`
- `JWT_SECRET`
- `FRONTEND_URL` (ex: https://mon-site.vercel.app)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Stockage fichiers: `S3_BUCKET`, `S3_KEY`, `S3_SECRET`, `S3_REGION` (fortement recommandé)

Étapes pour Render (backend)
1. Dans Render, créez une Postgres Database — notez la `DATABASE_URL`.
2. Déployez un Web Service en pointant sur ce dépôt et en choisissant `Docker`.
   - Dockerfile: `backend/Dockerfile` (déjà présent)
   - Build & Start: Render utilisera le Dockerfile; sinon `npm install` puis `npm start`.
3. Dans les settings du service, ajoutez les env vars listées ci-dessus.
4. Pour les fichiers uploads: ne pas compter sur le filesystem Render (éphémère).
   - Configurez un bucket S3 (ou équivalent) et mettez les clés en env vars.
   - Adaptez le code pour utiliser S3 si nécessaire (middleware `multer-s3` ou upload direct via signed URL).
5. Migrations & seeds:
   - Après déploiement, exécutez vos migrations/seed via un job ou localement en pointant la `DATABASE_URL`.

Étapes pour Vercel (frontend)
1. Connectez le repo à Vercel et créez le projet (ou importer depuis GitHub).
2. Variables d'environnement (Project Settings):
   - `NEXT_PUBLIC_API_URL` = `https://<YOUR_RENDER_BACKEND_URL>/api`
3. Build Command: `npm run build` (déjà détecté pour Next.js)
4. Déployez — Vercel build puis preview/prod.

Remarques importantes
- CORS: le backend permet par défaut tous les origines via `cors()`; vous pouvez restreindre en prod.
- Websockets: Render prend en charge WebSocket via Web Services; assurez-vous d'exposer le port et d'utiliser l'URL publique pour `socket.io` côté client.
- Notifications temps réel: vérifier `socket.handler.js` et configurer `JWT_SECRET` pour l'authentification.
- Stockage: pour les fichiers (images/audio/vidéo), configurez un stockage externe avant d'ouvrir l'upload en prod.

Conseil CI/CD
- Pour chaque déploiement, utilisez les variables d'environnement de Vercel/Render plutôt que de committer `.env`.
- Tester en staging: créez un projet Vercel preview branch et un service Render staging (ou une branche) avant production.

Si vous voulez, j'automatise la création du `render.yaml` (déjà ajouté) et je peux créer des scripts pour:
- exécuter les migrations automatiquement au déploiement
- uploader automatiquement les assets vers un bucket S3

Mise en œuvre des migrations
- Localement: placez votre `DATABASE_URL` puis exécutez depuis `backend/`:

```bash
npm run migrate
```

- Sur Render: un job `run-migrations` est défini dans `render.yaml`. Après avoir déployé la base
   et le service, vous pouvez exécuter ce job depuis le tableau de bord Render (Jobs → `run-migrations`),
   ou automatiser via l'API Render/CLI qui déclenche le job.

Notes:
- `scripts/sync_models_to_db.js` synchronise les modèles Sequelize dans le schéma `signal_moi`.
- Ne pas exécuter la migration sur une base de production sans backup; tester d'abord en staging.
