require('dotenv').config()
const express = require('express')
const cors = require('cors')
const db = require('./config/database')

// ✅ Vérifier les variables d'environnement essentielles
console.log('🔍 Vérification des variables d\'environnement...')
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET']
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.warn(`⚠️  WARNING: ${varName} n'est pas défini. Utilisation de valeur par défaut.`)
    } else {
        console.log(`✅ ${varName}: Défini`)
    }
})

const authRoutes = require('./routes/auth.routes')
const adminRoutes = require('./routes/admin.routes')
const campagneRoutes = require('./routes/campagne.routes')
const plaidoyerRoutes = require('./routes/plaidoyer.routes')
const signalementRoutes = require('./routes/signalement.routes')

const app = express()

// ✅ Middleware de logging global
app.use((req, res, next) => {
    console.log(`\n📨 [${new Date().toISOString()}] ${req.method} ${req.path}`)
    console.log(`   Headers: Authorization=${req.headers.authorization ? '✅ Présent' : '❌ Manquant'}`)
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`   Body: ${JSON.stringify(req.body).substring(0, 100)}...`)
    }
    next()
})

// CORS - permettre les requêtes depuis Vercel
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        process.env.FRONTEND_URL || '*'
    ],
    credentials: true
}))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/campagnes', campagneRoutes)
app.use('/api/signalements', signalementRoutes)
app.use('/api/plaidoyers', plaidoyerRoutes)

app.get('/api/health', (req, res) => {
    console.log('✅ Health check reçu')
    res.json({ status: 'OK', message: 'Backend fonctionne', timestamp: new Date().toISOString() })
})

// ✅ Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    console.error(`❌ [ERROR] ${err.message}`)
    console.error(err.stack)
    res.status(500).json({ error: 'Erreur serveur interne' })
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ Serveur démarré sur le port ${PORT}`)
    console.log(`📡 Frontend URL configurée: ${process.env.FRONTEND_URL || 'non défini'}`)
    console.log(`🔒 JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Défini' : '❌ NON DÉFINI'}`)
    console.log(`${'='.repeat(60)}\n`)
})
