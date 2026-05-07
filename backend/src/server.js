const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/signalements', signalementRoutes);
app.use('/api/config', configRoutes);

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

app.listen(PORT, () => {
  console.log(`
  ==================================================
  Serveur Signal-Moi démarré !
  http://localhost:${PORT}
  Login: POST http://localhost:${PORT}/api/auth/login
  ==================================================
  `);
});

module.exports = app;