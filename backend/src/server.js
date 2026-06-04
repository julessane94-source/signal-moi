require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const db = require('./config/database');
const { setupSocket } = require('./socket/socket.handler');
const { initializeDatabase } = require('./config/database-init');

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
const contactRoutes = require('./routes/contact.routes');
const collaboratorRoutes = require('./routes/collaborator.routes');
const lawEnforcementRoutes = require('./routes/law-enforcement.routes');
const statisticsRoutes = require('./routes/statistics');
const postsRoutes = require('./routes/posts.routes');
const accountRoutes = require('./routes/account');

const app = express();

// CORS - permettre les requêtes depuis Vercel
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        process.env.FRONTEND_URL || '*'
    ],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Refresh-Token']
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
app.use('/api/auth', accountRoutes); // Routes de compte (suppression, etc.)
app.use('/api/admin', adminRoutes);
app.use('/api/campagnes', campagneRoutes);
app.use('/api/signalements', signalementRoutes);
app.use('/api/plaidoyers', plaidoyerRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/init', initRoutes);
app.use('/api/pages', pagesRoutes); // Routes PUBLIQUES pour les pages du site
app.use('/api/contact', contactRoutes); // Formulaire de contact PUBLIQUE
app.use('/api/collaborator', collaboratorRoutes); // Dashboard collaborateur (ONG/Association)
app.use('/api/law-enforcement', lawEnforcementRoutes); // Dashboard police/gendarmerie
app.use('/api/statistics', statisticsRoutes); // Statistiques pour admin et collaborateur
app.use('/api/posts', postsRoutes); // Blog posts

// Debug routes (dev only)
const debugRoutes = require('./routes/debug.routes');
app.use('/api/debug', debugRoutes);

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

// Servir les fichiers statiques (uploads)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Fallback: si le fichier n'existe pas dans le dossier local, servir depuis la base de données
app.get('/uploads/*', async (req, res, next) => {
    try {
        const filePath = req.path.replace(/^\/+/, '');
        const result = await db.query(
            'SELECT mime_type, file_data FROM signal_moi.fichiers WHERE chemin = $1 LIMIT 1',
            [filePath]
        );
        const file = result.rows[0];
        if (!file || !file.file_data) {
            // If the requested file is a campaign image and not found, return a small SVG placeholder
            if (filePath.startsWith('uploads/campagnes/')) {
                const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>\n  <rect width='100%' height='100%' fill='#f3f4f6'/>\n  <g fill='#e11d48' font-family='Arial, Helvetica, sans-serif' font-size='32' text-anchor='middle'>\n    <text x='50%' y='45%' fill='#ef4444' font-weight='700'>Image indisponible</text>\n    <text x='50%' y='62%' fill='#6b7280' font-size='18'>Campagne — image manquante</text>\n  </g>\n</svg>`;
                res.type('image/svg+xml');
                return res.send(svg);
            }
            return next();
        }
        if (file.mime_type) {
            res.type(file.mime_type);
        }
        return res.send(file.file_data);
    } catch (err) {
        console.error('[UPLOAD FALLBACK] Erreur de récupération du fichier depuis la base de données:', err);
        next(err);
    }
});

// Ensure uploads directories exist at startup to avoid missing-folder issues
const fs = require('fs');
const uploadsRoot = path.join(__dirname, '..', 'uploads');
const requiredDirs = ['signalements', 'profiles', 'temp', 'campagnes', 'logos'];
try {
    if (!fs.existsSync(uploadsRoot)) {
        fs.mkdirSync(uploadsRoot, { recursive: true });
        console.log(`✅ Created uploads root at ${uploadsRoot}`);
    }
    requiredDirs.forEach(d => {
        const p = path.join(uploadsRoot, d);
        if (!fs.existsSync(p)) {
            fs.mkdirSync(p, { recursive: true });
            console.log(`✅ Created uploads directory: ${p}`);
        }
    });
} catch (err) {
    console.error('❌ Failed to ensure uploads directories exist:', err.message);
}

const ensureDbSchema = async () => {
    try {
        await db.query(`
            ALTER TABLE signal_moi.fichiers
            ADD COLUMN IF NOT EXISTS file_data BYTEA
        `);
        await db.query(`
            ALTER TABLE signal_moi.fichiers
            ADD COLUMN IF NOT EXISTS campagne_id UUID
        `);
        await db.query(`
            ALTER TABLE signal_moi.fichiers
            ALTER COLUMN signalement_id DROP NOT NULL
        `);
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_fichiers_campagne ON signal_moi.fichiers(campagne_id)
        `);
        console.log('✅ Schéma signal_moi.fichiers vérifié ou ajusté');
    } catch (err) {
        console.warn('⚠️ Impossible de garantir le schéma signal_moi.fichiers:', err.message);
    }
};
ensureDbSchema();

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint non trouve', 
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
            'http://127.0.0.1:3000',
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

// Initialiser la base de données puis démarrer le serveur
const startServer = async () => {
    try {
        await initializeDatabase();
        
        // Démarrer le serveur
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`\n✅ Serveur démarré sur le port ${PORT}`);
            console.log(`📡 Frontend URL configurée: ${process.env.FRONTEND_URL || 'non défini'}`);
            console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔌 Socket.io initialisé`);
            console.log(`📊 Timestamp démarrage: ${new Date().toISOString()}\n`);
        });
    } catch (err) {
        console.error('❌ Erreur au démarrage du serveur :', err);
        process.exit(1);
    }
};

startServer();
