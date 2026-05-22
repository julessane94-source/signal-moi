require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/database');

// ✅ Vérifier les variables d'environnement essentielles
console.log('🔍 Vérification des variables d\'environnement...');
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.warn(`⚠️  WARNING: ${varName} n'est pas défini. Utilisation de valeur par défaut.`);
    } else {
        console.log(`✅ ${varName}: Défini`);
    }
});

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const campagneRoutes = require('./routes/campagne.routes');
const plaidoyerRoutes = require('./routes/plaidoyer.routes');
const signalementRoutes = require('./routes/signalement.routes');

const app = express();

// CORS - permettre les requêtes depuis Vercel
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        process.env.FRONTEND_URL || '*'
    ],
    credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/campagnes', campagneRoutes);
app.use('/api/signalements', signalementRoutes);
app.use('/api/plaidoyers', plaidoyerRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend fonctionne', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur le port ${PORT}`);
    console.log(`📡 Frontend URL configurée: ${process.env.FRONTEND_URL || 'non défini'}`);
});
