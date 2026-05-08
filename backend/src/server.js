const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();

// Middleware CORS: restreindre en production via FRONTEND_URL
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_API_URL || '*';
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Header charset
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Handle JSON parse errors (invalid JSON payloads)
app.use((err, req, res, next) => {
  if (err && (err instanceof SyntaxError || err.type === 'entity.parse.failed')) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});

// Import des routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const signalementRoutes = require('./routes/signalement.routes');
const configRoutes = require('./routes/config.routes');
const testRoutes = require('./routes/test.routes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/signalements', signalementRoutes);
app.use('/api/config', configRoutes);
app.use('/api/test', testRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend fonctionne' });
});

// Route d'accueil
app.get('/api', (req, res) => {
  res.json({
    message: 'API Signal-Moi',
    version: '1.0.0',
    endpoints: ['/api/auth/login', '/api/auth/register', '/api/health', '/api/admin/users']
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvee' });
});

const PORT = process.env.PORT || 5000;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Setup socket handlers (if present)
try {
  const { setupSocket } = require('./socket/socket.handler');
  setupSocket(io);
} catch (e) {
  console.warn('No socket handler found or error during setupSocket:', e.message);
}

server.listen(PORT, () => {
  console.log(`\n  ==================================================\n  Serveur Signal-Moi démarré !\n  http://localhost:${PORT}\n  Login: POST http://localhost:${PORT}/api/auth/login\n  Socket origin: ${FRONTEND_URL}\n  ==================================================\n  `);
});

module.exports = { app, server, io };