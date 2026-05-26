const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Middleware d'authentification
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

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM plaidoyers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// GET les plaidoyers signes par un utilisateur
router.get('/signed/user/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params;
    
    try {
        const result = await db.query(`
            SELECT p.* FROM plaidoyers p
            INNER JOIN signatures_plaidoyers sp ON sp.plaidoyer_id = p.id
            WHERE sp.user_id = $1
            ORDER BY sp.date_signature DESC
        `, [userId]);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur GET /signed/user/:userId:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// POST - Signer un plaidoyer
router.post('/:id/sign', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;
    
    try {
        // Verifier que le plaidoyer existe
        const plaidoyerResult = await db.query('SELECT * FROM plaidoyers WHERE id = $1', [id]);
        if (plaidoyerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Plaidoyer non trouve' });
        }

        // Verifier que l'utilisateur n'a pas deja signe
        const existingResult = await db.query(
            'SELECT * FROM signatures_plaidoyers WHERE plaidoyer_id = $1 AND user_id = $2',
            [id, user_id]
        );
        
        if (existingResult.rows.length > 0) {
            return res.status(400).json({ error: 'Vous avez deja signe ce plaidoyer' });
        }

        // Ajouter la signature
        const signatureId = uuidv4();
        const result = await db.query(
            `INSERT INTO signatures_plaidoyers (id, plaidoyer_id, user_id, date_signature)
             VALUES ($1, $2, $3, NOW())
             RETURNING *`,
            [signatureId, id, user_id]
        );

        res.json({
            success: true,
            message: 'Plaidoyer signe avec succes',
            signature: result.rows[0]
        });
    } catch (err) {
        console.error('Erreur POST /:id/sign:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

module.exports = router;
