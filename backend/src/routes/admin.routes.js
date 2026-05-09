const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Middleware de log
router.use((req, res, next) => {
  console.log(`[ADMIN] ${req.method} ${req.originalUrl}`);
  next();
});

// GET tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const result = await db.query('SELECT id, prenom, nom, email, telephone, ville, quartier, role, is_active FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur GET users:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// POST création utilisateur
router.post('/users', async (req, res) => {
  console.log('Body reçu:', req.body);
  const { prenom, nom, email, telephone, password, ville, quartier, role } = req.body;

  if (!prenom || !nom || !email || !telephone || !password || !ville || !quartier) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  try {
    const insertQuery = `
      INSERT INTO users (prenom, nom, email, telephone, password, ville, quartier, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, prenom, nom, email, role
    `;
    const values = [prenom, nom, email, telephone, password, ville, quartier, role || 'citoyen'];
    const result = await db.query(insertQuery, values);
    console.log('Utilisateur créé:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur insertion:', err);
    // Renvoyer l'erreur détaillée
    res.status(500).json({ error: 'Erreur SQL', message: err.message, detail: err });
  }
});

module.exports = router;
