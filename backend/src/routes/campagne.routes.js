const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');

// ? Middleware d'authentification
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token d\'authentification manquant' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token invalide', details: err.message });
    }
};

// GET toutes les campagnes
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM signal_moi.campagnes ORDER BY date_debut ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// GET détail d'une campagne + nombre d'inscrits
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const campagneResult = await db.query(
      'SELECT * FROM signal_moi.campagnes WHERE id = $1',
      [id]
    );
    
    if (campagneResult.rows.length === 0) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    
    const campagne = campagneResult.rows[0];
    
    // Récupérer le nombre d'inscrits
    const inscritsResult = await db.query(
      'SELECT COUNT(*) as total FROM signal_moi.inscriptions_campagnes WHERE campagne_id = $1',
      [id]
    );
    
    campagne.nombre_inscrits = parseInt(inscritsResult.rows[0].total);
    
    res.json(campagne);
  } catch (err) {
    console.error('Erreur GET /:id campagne:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// POST s'inscrire à une campagne (protégé)
router.post('/:id/inscrire', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  
  try {
    // Vérifier que la campagne existe
    const campagneResult = await db.query(
      'SELECT * FROM signal_moi.campagnes WHERE id = $1',
      [id]
    );
    
    if (campagneResult.rows.length === 0) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    
    const campagne = campagneResult.rows[0];
    
    // Vérifier que l'utilisateur n'est pas déjà inscrit
    const existingResult = await db.query(
      'SELECT * FROM signal_moi.inscriptions_campagnes WHERE campagne_id = $1 AND user_id = $2',
      [id, user_id]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Vous êtes déjà inscrit à cette campagne' });
    }
    
    // Vérifier la capacité
    const inscritsResult = await db.query(
      'SELECT COUNT(*) as total FROM signal_moi.inscriptions_campagnes WHERE campagne_id = $1',
      [id]
    );
    
    const nombreInscrits = parseInt(inscritsResult.rows[0].total);
    if (nombreInscrits >= campagne.capacite_max) {
      return res.status(400).json({ error: 'Campagne complète' });
    }
    
    // Ajouter l'inscription
    const insertResult = await db.query(
      `INSERT INTO signal_moi.inscriptions_campagnes (campagne_id, user_id, date_inscription)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [id, user_id]
    );
    
    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      inscription: insertResult.rows[0]
    });
  } catch (err) {
    console.error('Erreur POST /:id/inscrire:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// DELETE se désinscrire d'une campagne (protégé)
router.delete('/:id/inscrire', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  
  try {
    const result = await db.query(
      'DELETE FROM signal_moi.inscriptions_campagnes WHERE campagne_id = $1 AND user_id = $2 RETURNING *',
      [id, user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }
    
    res.json({
      success: true,
      message: 'Désinscription réussie'
    });
  } catch (err) {
    console.error('Erreur DELETE /:id/inscrire:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// GET inscrits à une campagne (protégé - collaborateur uniquement)
router.get('/:id/inscrits', authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  // Vérifier que c'est un collaborateur
  if (req.user.role !== 'collaborateur' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  
  try {
    const result = await db.query(
      `SELECT ic.id, ic.campagne_id, ic.user_id, ic.date_inscription,
              u.prenom, u.nom, u.email, u.telephone
       FROM signal_moi.inscriptions_campagnes ic
       LEFT JOIN signal_moi.users u ON u.id = ic.user_id
       WHERE ic.campagne_id = $1
       ORDER BY ic.date_inscription DESC`,
      [id]
    );
    
    const inscrits = result.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      dateInscription: r.date_inscription,
      user: {
        prenom: r.prenom,
        nom: r.nom,
        email: r.email,
        telephone: r.telephone
      }
    }));
    
    res.json(inscrits);
  } catch (err) {
    console.error('Erreur GET /:id/inscrits:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// POST pour créer une campagne (protégé - admin uniquement)
router.post('/', authMiddleware, async (req, res) => {
  const { titre, description, type, date_debut, date_fin, lieu, capacite_max, created_by } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO signal_moi.campagnes (titre, description, type, date_debut, date_fin, lieu, capacite_max, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [titre, description, type, date_debut, date_fin, lieu, capacite_max || 100, created_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur cr�ation campagne' });
  }
});

module.exports = router;

