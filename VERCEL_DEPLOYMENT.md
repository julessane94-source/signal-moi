# 🚀 Guide de Déploiement avec Vercel

## Architecture
- **Frontend** : Vercel (signal-moi.vercel.app)
- **Backend** : Render (signal-moi-api.onrender.com)
- **Database** : Render PostgreSQL

## Prérequis
1. Compte Vercel (https://vercel.com)
2. Compte Render (https://render.com)
3. Vercel CLI installé : `npm install -g vercel`
4. Git configuré avec le repository

## Étapes de Déploiement

### 1. Déployer le Backend sur Render
```bash
# 1a. Pousser le code sur GitHub
git push origin master

# 1b. Aller sur render.com > New > Web Service
# Sélectionner le repository GitHub signal-moi
# Utiliser render.yaml comme configuration
# S'assurer que la base de données Render PostgreSQL est créée
# Configurer les variables d'environnement:
#   - JWT_SECRET (valeur sécurisée)
#   - JWT_REFRESH_SECRET (valeur sécurisée)
#   - FRONTEND_URL=https://signal-moi.vercel.app
#   - ADMIN_SECRET_KEY=signal-moi-admin-secret-key
```

### 2. Déployer le Frontend sur Vercel
```bash
cd frontend

# Première déploiement (lié au compte Vercel)
vercel --prod

# Ou via l'interface web:
# 1. Aller sur vercel.com > New Project
# 2. Importer le repository GitHub signal-moi
# 3. Framework: Next.js
# 4. Root Directory: frontend
# 5. Variables d'environnement (si différent de .env.local):
#    - NEXT_PUBLIC_API_URL=https://signal-moi-api.onrender.com
#    - NEXT_PUBLIC_WS_URL=wss://signal-moi-api.onrender.com
```

### 3. Configurer les variables d'environnement Vercel
Dans le dashboard Vercel > Settings > Environment Variables:
```
NEXT_PUBLIC_API_URL = https://signal-moi-api.onrender.com
NEXT_PUBLIC_WS_URL = wss://signal-moi-api.onrender.com
```

## Tester la Création de Campagne

### Test sur Vercel
1. Ouvrir https://signal-moi.vercel.app
2. S'enregistrer comme collaborateur
3. Se connecter
4. Cliquer sur "Create Campaign"
5. Remplir le formulaire
6. Vérifier que la campagne est créée

### Dépannage

#### Erreur: "API request failed"
- Vérifier que le backend Render est en ligne
- Vérifier les logs Render pour les erreurs

#### Erreur: "Database connection failed"
- S'assurer que la base PostgreSQL Render est running
- Vérifier les credentials DATABASE_URL

#### Erreur: "CORS error"
- Vérifier que le FRONTEND_URL sur Render correspond à https://signal-moi.vercel.app
- Vérifier la configuration CORS dans backend/src/server.js

## Logs et Monitoring

### Vercel Logs
```bash
vercel logs signal-moi
```

### Render Logs
Dashboard Render > Select Service > Logs

## Rollback
```bash
# Revenir à la dernière version de Vercel
vercel rollback
```

## Domaine personnalisé
1. Vercel Dashboard > Settings > Domains
2. Ajouter un domaine personnalisé (ex: signal-moi.fr)
3. Configurer les DNS records

---
**Status**: ✅ Frontend prêt pour Vercel
**Status**: ⚠️ Backend nécessite configuration PostgreSQL Render

Mise à jour: 2026-05-28
