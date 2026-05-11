const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET toutes les campagnes
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM campagnes ORDER BY date_debut ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// POST pour créer une campagne
router.post('/', async (req, res) => {
  const { titre, description, type, date_debut, date_fin, lieu, capacite_max, created_by } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO campagnes (titre, description, type, date_debut, date_fin, lieu, capacite_max, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [titre, description, type, date_debut, date_fin, lieu, capacite_max || 100, created_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur création campagne' });
  }
});

module.exports = router;