const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

// Liste les fichiers présents dans uploads/signalements
router.get('/uploads/signalements', (req, res) => {
  try {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'signalements');
    if (!fs.existsSync(dir)) return res.json({ files: [], message: 'Dossier inexistant' });
    const files = fs.readdirSync(dir).map(f => ({ name: f, path: `/uploads/signalements/${f}` }));
    res.json({ files });
  } catch (err) {
    console.error('Debug list files error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Lister les fichiers présents dans uploads/campagnes et les enregistrements DB correspondants
router.get('/uploads/campagnes', async (req, res) => {
  try {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'campagnes');
    const localFiles = fs.existsSync(dir) ? fs.readdirSync(dir).map(f => ({ name: f, path: `/uploads/campagnes/${f}` })) : [];

    // Récupérer les enregistrements en base pour les chemins commençant par uploads/campagnes/
    const dbResult = await db.query("SELECT id, nom_fichier, chemin, type, mime_type FROM signal_moi.fichiers WHERE chemin LIKE 'uploads/campagnes/%' ORDER BY id DESC LIMIT 500");
    const dbFiles = dbResult.rows || [];

    res.json({ localFiles, dbFiles });
  } catch (err) {
    console.error('Debug list campagnes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Lister les enregistrements fichiers pour un signalement_id
router.get('/fichiers/signalement/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT id, nom_fichier, chemin, type, mime_type FROM signal_moi.fichiers WHERE signalement_id = $1', [id]);
    res.json({ fichiers: result.rows });
  } catch (err) {
    console.error('Debug DB query error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
