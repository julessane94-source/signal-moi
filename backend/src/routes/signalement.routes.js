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

// Middleware d'authentification optionnelle
const optionalAuthMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return next();
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
        req.user = decoded;
    } catch (err) {
        // Ignorer le token invalide ; continuer sans utilisateur
    }
    next();
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
                const result = await db.query(`SELECT id, user_id, titre, description, type, statut, localisation, latitude, longitude, fichiers, created_at, updated_at
                                               FROM signalements ORDER BY created_at DESC LIMIT 200`);
                const rows = result.rows.map(r => ({
                    id: r.id,
                    userId: r.user_id,
                    titre: r.titre,
                    description: r.description,
                    type: r.type,
                    statut: r.statut,
                    localisation: r.localisation,
                    latitude: r.latitude !== null ? parseFloat(r.latitude) : null,
                    longitude: r.longitude !== null ? parseFloat(r.longitude) : null,
                    fichiers: r.fichiers || {},
                    createdAt: r.created_at,
                    updatedAt: r.updated_at
                }));
                res.json(rows);
            } catch (err) {
                console.error('Erreur GET /public signalements:', err);
                res.status(500).json({ error: 'Erreur serveur' });
            }
        });

        // GET générique: signalements selon le rôle / utilisateur
        router.get('/', optionalAuthMiddleware, async (req, res) => {
            try {
                if (req.user && req.user.role === 'citoyen') {
                    const result = await db.query(`SELECT id, user_id, titre, description, type, statut, localisation, latitude, longitude, fichiers, created_at, updated_at
                                                   FROM signalements WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200`, [req.user.id]);
                    const rows = result.rows.map(r => ({
                        id: r.id,
                        userId: r.user_id,
                        titre: r.titre,
                        description: r.description,
                        type: r.type,
                        statut: r.statut,
                        localisation: r.localisation,
                        latitude: r.latitude !== null ? parseFloat(r.latitude) : null,
                        longitude: r.longitude !== null ? parseFloat(r.longitude) : null,
                        fichiers: r.fichiers || {},
                        createdAt: r.created_at,
                        updatedAt: r.updated_at
                    }));
                    return res.json(rows);
                }
                // Si c'est la police, ne retourner que les types pertinents (violence, vol)
                if (req.user && req.user.role === 'police') {
                    const allowed = ['violence', 'vol', 'theft'];
                    const result = await db.query(`SELECT s.*, u.prenom AS user_prenom, u.nom AS user_nom, u.telephone AS user_telephone
                                                   FROM signalements s
                                                   LEFT JOIN users u ON u.id = s.user_id
                                                   WHERE LOWER(s.type) = ANY($1::text[])
                                                   ORDER BY s.created_at DESC LIMIT 500`, [allowed]);
                    const rows = result.rows.map(r => ({
                        id: r.id,
                        titre: r.titre,
                        description: r.description,
                        type: r.type,
                        statut: r.statut,
                        localisation: r.localisation,
                        latitude: r.latitude !== null ? parseFloat(r.latitude) : null,
                        longitude: r.longitude !== null ? parseFloat(r.longitude) : null,
                        fichiers: r.fichiers || {},
                        createdAt: r.created_at,
                        updatedAt: r.updated_at,
                        author: {
                            id: r.user_id,
                            prenom: r.user_prenom,
                            nom: r.user_nom,
                            telephone: r.user_telephone
                        }
                    }));
                    return res.json(rows);
                }

                const result = await db.query(`SELECT s.*, u.prenom AS user_prenom, u.nom AS user_nom, u.telephone AS user_telephone
                                               FROM signalements s
                                               LEFT JOIN users u ON u.id = s.user_id
                                               ORDER BY s.created_at DESC LIMIT 500`);
                const rows = result.rows.map(r => ({
                    id: r.id,
                    titre: r.titre,
                    description: r.description,
                    type: r.type,
                    statut: r.statut,
                    localisation: r.localisation,
                    latitude: r.latitude !== null ? parseFloat(r.latitude) : null,
                    longitude: r.longitude !== null ? parseFloat(r.longitude) : null,
                    fichiers: r.fichiers || {},
                    createdAt: r.created_at,
                    updatedAt: r.updated_at,
                    author: {
                        id: r.user_id,
                        prenom: r.user_prenom,
                        nom: r.user_nom,
                        telephone: r.user_telephone
                    }
                }));
                res.json(rows);
            } catch (err) {
                console.error('Erreur GET / signalements:', err);
                res.status(500).json({ error: 'Erreur serveur' });
            }
        });

        // GET pour un utilisateur: ses propres signalements (protégé)
        router.get('/user/:userId', authMiddleware, async (req, res) => {
            const { userId } = req.params;
            // ✅ FIX: Empêcher un utilisateur de voir les signalements d'un autre
            if (userId !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Accès refusé' });
            }
            try {
                const result = await db.query(`SELECT id, user_id, titre, description, type, statut, localisation, latitude, longitude, fichiers, created_at, updated_at
                                               FROM signalements WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
                const rows = result.rows.map(r => ({
                    id: r.id,
                    userId: r.user_id,
                    titre: r.titre,
                    description: r.description,
                    type: r.type,
                    statut: r.statut,
                    localisation: r.localisation,
                    latitude: r.latitude !== null ? parseFloat(r.latitude) : null,
                    longitude: r.longitude !== null ? parseFloat(r.longitude) : null,
                    fichiers: r.fichiers || {},
                    createdAt: r.created_at,
                    updatedAt: r.updated_at
                }));
                res.json(rows);
            } catch (err) {
                console.error('Erreur GET /user/:userId signalements:', err);
                res.status(500).json({ error: 'Erreur serveur' });
            }
        });

module.exports = router;