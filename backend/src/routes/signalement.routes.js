const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET tous les signalements
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM signalements ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// POST pour créer un signalement
router.post('/', async (req, res) => {
  const { user_id, titre, description, type, localisation, latitude, longitude, fichiers } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO signalements (user_id, titre, description, type, localisation, latitude, longitude, fichiers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user_id, titre, description, type, localisation, latitude, longitude, fichiers || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur création signalement' });
  }
});

module.exports = router;