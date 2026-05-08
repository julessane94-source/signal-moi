Production: variables à définir (récapitulatif rapide)

- Render (backend service):
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `FRONTEND_URL` (ex: https://signal-moi-1.vercel.app)
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
  - Stockage: `USE_S3=true`, `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (ou `S3_KEY`/`S3_SECRET`), `S3_BUCKET`, `S3_REGION`

- Vercel (frontend):
  - `NEXT_PUBLIC_API_URL` (ex: https://signal-moi-api.onrender.com/api)
  - `NEXT_PUBLIC_SOCKET_URL` (ex: wss://signal-moi-api.onrender.com)

Tester l'endpoint d'upload (exemple)

- Depuis Linux/macOS ou `curl.exe` sur Windows:

```bash
curl -v -X POST "https://signal-moi-api.onrender.com/api/test/upload" -F "file=@/chemin/vers/fichier.jpg"
```

- Depuis PowerShell (exemple simplifié):

```powershell
$filePath = 'C:\chemin\vers\fichier.jpg'
$form = @{ file = Get-Item $filePath }
Invoke-RestMethod -Uri 'https://signal-moi-api.onrender.com/api/test/upload' -Method Post -Form $form
```

Remarque: en production, vérifiez que `USE_S3=true` et que les clés S3 sont valides pour que les uploads persistent.
