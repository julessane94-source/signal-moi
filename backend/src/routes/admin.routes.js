// backend/src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SiteConfig = require('../models/SiteConfig');

// ✅ Middleware d'authentification admin
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token d\'authentification manquant' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
        
        // Vérifier que c'est un admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Accès administrateur requis' });
        }
        
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token invalide', details: err.message });
    }
};

// --- Routes de test (Ã  conserver pour le dÃ©bogage) ---
router.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as now');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Gestion des utilisateurs ---
// GET /api/admin/users - Récupère la liste de tous les utilisateurs (protégé)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT id, prenom, nom, email, telephone, ville, quartier, role, is_active FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('[ADMIN GET /users] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// POST /api/admin/users - Crée un nouvel utilisateur (protégé)
router.post('/users', authMiddleware, async (req, res) => {
  console.log('[ADMIN POST /users] Body reÃ§u:', req.body);
  const { prenom, nom, email, telephone, password, ville, quartier, role } = req.body;

  // Validation basique des champs obligatoires
  if (!prenom || !nom || !email || !telephone || !password || !ville || !quartier) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  try {
    const hashed = await require('bcrypt').hash(password, 10);
    const insertQuery = `
      INSERT INTO users (prenom, nom, email, telephone, password, ville, quartier, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, prenom, nom, email, role
    `;
    const values = [prenom, nom, email, telephone, hashed, ville, quartier, role || 'citoyen'];
    const result = await db.query(insertQuery, values);
    console.log('[ADMIN POST /users] Utilisateur créé:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[ADMIN POST /users] Erreur SQL:', err);
    res.status(500).json({ error: 'Erreur lors de la création', details: err.message });
  }
});

// Ajoutez cette route après les autres routes GET (par exemple après `/users`)
router.get('/signalements', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM signalements ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/site-config', authMiddleware, async (req, res) => {
  try {
    const config = await SiteConfig.getAll();
    res.json(config);
  } catch (err) {
    console.error('[ADMIN GET /site-config] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

router.post('/site-config', authMiddleware, async (req, res) => {
  try {
    const { siteName, contactEmail, contactPhone, address } = req.body;
    if (!siteName || !contactEmail || !contactPhone || !address) {
      return res.status(400).json({ error: 'Tous les champs de configuration sont requis' });
    }

    await Promise.all([
      SiteConfig.set('siteName', siteName),
      SiteConfig.set('contactEmail', contactEmail),
      SiteConfig.set('contactPhone', contactPhone),
      SiteConfig.set('address', address)
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('[ADMIN POST /site-config] Erreur:', err);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde', details: err.message });
  }
});

module.exports = router;

