const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');

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

router.post('/', authMiddleware, async (req, res) => {
    console.log('Body reçu pour signalement :', req.body);
    console.log('Utilisateur connecté:', req.user);

    const { titre, description, type, localisation, latitude, longitude, fichiers } = req.body;
    const user_id = req.user.id;  // ✅ FIX: Get user_id from JWT token, not from request body

    // Vérifier les champs obligatoires
    if (!titre || !description || !type || !localisation) {
        return res.status(400).json({ error: 'Champs manquants : titre, description, type, localisation' });
    }

    try {
        const result = await db.query(
            `INSERT INTO signalements (user_id, titre, description, type, localisation, latitude, longitude, fichiers)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [user_id, titre, description, type, localisation, latitude || null, longitude || null, fichiers || []]
        );
        console.log('Signalement créé:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erreur SQL :', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

    // GET public: liste publique des signalements
    router.get('/public', async (req, res) => {
        try {
            const result = await db.query('SELECT * FROM signalements ORDER BY date_signalement DESC');
            res.json(result.rows);
        } catch (err) {
            console.error('Erreur GET /public signalements:', err);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    });

    // GET pour un utilisateur: ses propres signalements (protégé)
    router.get('/user/:userId', authMiddleware, async (req, res) => {
        const { userId } = req.params;
        // ✅ FIX: Empêcher un utilisateur de voir les signalements d'un autre
        if (parseInt(userId) !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        try {
            const result = await db.query('SELECT * FROM signalements WHERE user_id = $1 ORDER BY date_signalement DESC', [userId]);
            res.json(result.rows);
        } catch (err) {
            console.error('Erreur GET /user/:userId signalements:', err);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    });

module.exports = router;