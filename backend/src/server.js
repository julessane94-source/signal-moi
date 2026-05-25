require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const db = require('./config/database');
const { setupSocket } = require('./socket/socket.handler');

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
const citizenRoutes = require('./routes/citizen.routes');
const initRoutes = require('./routes/init.routes');
const pagesRoutes = require('./routes/pages.routes');
const collaboratorRoutes = require('./routes/collaborator.routes');
const lawEnforcementRoutes = require('./routes/law-enforcement.routes');

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

// Middleware de logging pour toutes les requêtes (sauf health checks)
app.use((req, res, next) => {
    // Ignorer les logs pour health checks
    if (req.path === '/' && (req.method === 'GET' || req.method === 'HEAD')) {
        return next();
    }
    if (req.path === '/api/health') {
        return next();
    }
    
    const authHeader = req.header('Authorization');
    const authStatus = authHeader ? '✅ Présent' : '❌ Manquant';
    console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log(`   Headers: Authorization=${authStatus}`);
    if (authHeader) {
        console.log(`   Token: ${authHeader.substring(0, 20)}...`);
    }
    next();
});

// Routes protégées et publiques
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/campagnes', campagneRoutes);
app.use('/api/signalements', signalementRoutes);
app.use('/api/plaidoyers', plaidoyerRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/init', initRoutes);
app.use('/api/pages', pagesRoutes); // Routes PUBLIQUES pour les pages du site
app.use('/api/collaborator', collaboratorRoutes); // Dashboard collaborateur (ONG/Association)
app.use('/api/law-enforcement', lawEnforcementRoutes); // Dashboard police/gendarmerie

// Health check endpoint (PUBLIC)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Backend fonctionne', 
        timestamp: new Date().toISOString(),
        port: process.env.PORT || 8080,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Endpoint racine (PUBLIC)
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'Service disponible',
        status: 'running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// HEAD / (PUBLIC - pour les health checks)
app.head('/', (req, res) => {
    res.status(200).send();
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint non trouvé', 
        path: req.path,
        method: req.method
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur:', err.message);
    res.status(err.status || 500).json({ 
        error: 'Erreur serveur interne',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 8080;

// Créer serveur HTTP pour socket.io
const server = http.createServer(app);

// Initialiser socket.io
const io = socketIO(server, {
    cors: {
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            process.env.FRONTEND_URL || '*'
        ],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Configurer les handlers socket
setupSocket(io);
// Rendre l'objet io accessible depuis les routes via global.io
global.io = io;

// Démarrer le serveur
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Serveur démarré sur le port ${PORT}`);
    console.log(`📡 Frontend URL configurée: ${process.env.FRONTEND_URL || 'non défini'}`);
    console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Socket.io initialisé`);
    console.log(`📊 Timestamp démarrage: ${new Date().toISOString()}\n`);
});
