const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.post('/', async (req, res) => {
    // Afficher ce que le frontend envoie (pour déboguer)
    console.log('Body reçu pour signalement :', req.body);

    const { user_id, titre, description, type, localisation, latitude, longitude, fichiers } = req.body;

    // Vérifier les champs obligatoires
    if (!user_id || !titre || !description || !type || !localisation) {
        return res.status(400).json({ error: 'Champs manquants : user_id, titre, description, type, localisation' });
    }

    try {
        const result = await db.query(
            `INSERT INTO signalements (user_id, titre, description, type, localisation, latitude, longitude, fichiers)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [user_id, titre, description, type, localisation, latitude || null, longitude || null, fichiers || []]
        );
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

    // GET pour un utilisateur: ses propres signalements
    router.get('/user/:userId', async (req, res) => {
        const { userId } = req.params;
        try {
            const result = await db.query('SELECT * FROM signalements WHERE user_id = $1 ORDER BY date_signalement DESC', [userId]);
            res.json(result.rows);
        } catch (err) {
            console.error('Erreur GET /user/:userId signalements:', err);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    });

module.exports = router;