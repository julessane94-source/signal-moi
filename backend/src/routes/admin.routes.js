// backend/src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

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
// GET /api/admin/users - RÃ©cupÃ¨re la liste de tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const result = await db.query('SELECT id, prenom, nom, email, telephone, ville, quartier, role, is_active FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('[ADMIN GET /users] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// POST /api/admin/users - CrÃ©e un nouvel utilisateur
router.post('/users', async (req, res) => {
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
router.get('/signalements', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM signalements ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

