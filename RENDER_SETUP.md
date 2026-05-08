Checklist et configuration pour Render (backend)

1) Créer le service Web
- Type: Web Service (Docker)
- Branch: main (ou la branche choisie)
- Dockerfile: `backend/Dockerfile`
- Port: 5000

2) Variables d'environnement (à coller dans Render > Environment)
- DATABASE_URL = <postgres://user:pass@host:port/dbname>
- NODE_ENV = production
- PORT = 5000
- JWT_SECRET = <chaine_secrete>
- FRONTEND_URL = https://signal-moi-1.vercel.app

SMTP (si envoi mail):
- SMTP_HOST = smtp.example.com
- SMTP_PORT = 587
- SMTP_USER = smtp_user
- SMTP_PASS = smtp_pass
- SMTP_FROM = "Signal-Moi <no-reply@example.com>"

Stockage fichiers (S3)
- USE_S3 = true
- AWS_ACCESS_KEY_ID = <AKIA...>
- AWS_SECRET_ACCESS_KEY = <secret>
- S3_BUCKET = signal-moi-bucket
- S3_REGION = eu-west-1
- S3_ENDPOINT = (optionnel, si compatible S3)

3) Jobs (migrations)
- Utilisez le `render.yaml` inclus qui définit un job `run-migrations`.
- Pour exécuter manuellement (une fois les envs définies) : depuis Render Dashboard → Jobs → run-migrations → Run job.

Commande alternative (local -> db prod) :
```bash
cd backend
node ../scripts/sync_models_to_db.js "${DATABASE_URL}"
node ../scripts/seed_signalements.js "${DATABASE_URL}"
```

4) Sécurité / CORS / WebSocket
- CORS: mettre `FRONTEND_URL` dans la liste blanche.
- WebSocket: utiliser l'URL publique du service Render (ex: `https://signal-moi-api.onrender.com`) ; côté client `NEXT_PUBLIC_SOCKET_URL` = `wss://signal-moi-api.onrender.com`.

5) Vérifications après déploiement
- Health: `GET https://<your-render-url>/api/health` doit répondre 200.
- Upload test (si USE_S3=false, fichiers temporaires persistants non garantis):
  - `curl -v -X POST "https://<your-render-url>/api/test/upload" -F "file=@/chemin/vers/fichier.jpg"`

Notes
- Ne committez jamais de secrets. Utilisez le tableau Render.
- Render web service est compatible WebSocket; vérifiez la configuration du load balancer si vous rencontrez des problèmes de socket.
