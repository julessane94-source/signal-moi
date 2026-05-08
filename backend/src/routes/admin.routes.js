const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/admin/users - Récupérer tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    // Pour Supabase/PostgreSQL
    const result = await db.query('SELECT id, prenom, nom, email, telephone, ville, quartier, role, is_active FROM users');
    res.json(result);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/users - Créer un utilisateur
router.post('/users', async (req, res) => {
  const { prenom, nom, email, telephone, password, ville, quartier, role } = req.body;
  
  try {
    const result = await db.query(
      'INSERT INTO users (prenom, nom, email, telephone, password, ville, quartier, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [prenom, nom, email, telephone, password || 'Default123!', ville, quartier, role || 'citoyen']
    );
    res.status(201).json({ message: 'Utilisateur créé', id: result.insertId });
  } catch (error) {
    console.error('Erreur création:', error);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

module.exports = router;