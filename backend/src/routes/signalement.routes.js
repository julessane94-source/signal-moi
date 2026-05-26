const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const { uploadMultiple } = require('../middlewares/upload');
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

router.post('/', authMiddleware, ...uploadMultiple('fichiers', 5), async (req, res) => {
    console.log('Body reçu pour signalement :', req.body);
    console.log('Utilisateur connecté :', req.user);

    const { titre, description, type, localisation, latitude, longitude } = req.body;
    const user_id = req.user.id;

    // Vérifier les champs obligatoires
    if (!titre || !description || !type || !localisation) {
        return res.status(400).json({ error: 'Champs manquants : titre, description, type, localisation' });
    }

    try {
        const result = await db.query(
            `INSERT INTO signal_moi.signalements (user_id, titre, description, type, localisation, latitude, longitude, image_url, images)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [user_id, titre, description, type, localisation, latitude || null, longitude || null, null, '[]']
        );
        const signalement = result.rows[0];

        // Gérer les fichiers uploadés (s'il y en a)
        if (req.files && req.files.length > 0) {
            const insertFiles = req.files.map(f => {
                const fileType = f.mimetype.startsWith('image') ? 'image' : f.mimetype.startsWith('video') ? 'video' : f.mimetype.startsWith('audio') ? 'audio' : 'document';
                const fileId = uuidv4();
                const chemin = f.path || (`uploads/signalements/${f.filename}`);
                return db.query(
                    `INSERT INTO signal_moi.fichiers (id, signalement_id, nom_fichier, chemin, type, taille, mime_type, uploaded_by)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [fileId, signalement.id, f.originalname, chemin, fileType, f.size || 0, f.mimetype, user_id]
                );
            });
            await Promise.all(insertFiles);

            // Mettre à jour la colonne image_url si le premier fichier est une image
            const firstImage = req.files.find(ff => ff.mimetype.startsWith('image'));
            if (firstImage) {
                const imagePath = firstImage.path || (`uploads/signalements/${firstImage.filename}`);
                await db.query('UPDATE signal_moi.signalements SET image_url = $1 WHERE id = $2', [imagePath, signalement.id]);
                signalement.image_url = imagePath;
            }
        }

        console.log('Signalement créé:', signalement);
        res.status(201).json(signalement);
    } catch (err) {
        console.error('Erreur SQL :', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

    // GET public: liste publique des signalements
        router.get('/public', async (req, res) => {
            try {
                const result = await db.query(`SELECT id, user_id, titre, description, type, statut, localisation, latitude, longitude, created_at, updated_at
                                               FROM signal_moi.signalements ORDER BY created_at DESC LIMIT 200`);
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
                    createdAt: r.created_at,
                    updatedAt: r.updated_at
                }));
                res.json(rows);
            } catch (err) {
                console.error('Erreur GET /public signalements:', err);
                res.status(500).json({ error: 'Erreur serveur' });
            }
        });

        // GET g�n�rique: signalements selon le r�le / utilisateur
        router.get('/', optionalAuthMiddleware, async (req, res) => {
            try {
                if (req.user && req.user.role === 'citoyen') {
                    const result = await db.query(`SELECT id, user_id, titre, description, type, statut, localisation, latitude, longitude, created_at, updated_at
                                                   FROM signal_moi.signalements WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200`, [req.user.id]);
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
                        createdAt: r.created_at,
                        updatedAt: r.updated_at
                    }));
                    return res.json(rows);
                }
                // Si c'est la police, ne retourner que les types pertinents (violence, vol)
                if (req.user && req.user.role === 'police') {
                    const allowed = ['violence', 'vol', 'theft'];
                    const result = await db.query(`SELECT s.id, s.user_id, s.titre, s.description, s.type, s.statut, s.localisation, s.latitude, s.longitude, s.priorite, s.est_anonyme, s.created_at, s.updated_at, u.prenom AS user_prenom, u.nom AS user_nom, u.telephone AS user_telephone, u.email AS user_email
                                                   FROM signal_moi.signalements s
                                                   LEFT JOIN signal_moi.users u ON u.id = s.user_id
                                                   WHERE LOWER(s.type) = ANY($1::text[])
                                                   ORDER BY s.created_at DESC LIMIT 500`, [allowed]);
                    const rows = await Promise.all(result.rows.map(async (r) => {
                        // Récupérer les fichiers pour ce signalement
                        const filesRes = await db.query(`SELECT id, signalement_id, nom_fichier, chemin, type, taille, mime_type, description
                                                        FROM signal_moi.fichiers WHERE signalement_id = $1 ORDER BY created_at DESC`, [r.id]);
                        return {
                            id: r.id,
                            titre: r.titre,
                            description: r.description,
                            type: r.type,
                            statut: r.statut,
                            priorite: r.priorite,
                            estAnonyme: r.est_anonyme,
                            localisation: r.localisation,
                            latitude: r.latitude !== null ? parseFloat(r.latitude) : null,
                            longitude: r.longitude !== null ? parseFloat(r.longitude) : null,
                            createdAt: r.created_at,
                            updatedAt: r.updated_at,
                            user: {
                                id: r.user_id,
                                prenom: r.user_prenom,
                                nom: r.user_nom,
                                telephone: r.user_telephone,
                                email: r.user_email
                            },
                            fichiers: filesRes.rows.map(f => ({
                                id: f.id,
                                nom_fichier: f.nom_fichier,
                                chemin: f.chemin,
                                type: f.type,
                                mime_type: f.mime_type,
                                taille: f.taille,
                                description: f.description
                            }))
                        };
                    }));
                    return res.json(rows);
                }

                const result = await db.query(`SELECT s.id, s.user_id, s.titre, s.description, s.type, s.statut, s.localisation, s.latitude, s.longitude, s.created_at, s.updated_at, u.prenom AS user_prenom, u.nom AS user_nom, u.telephone AS user_telephone
                                               FROM signal_moi.signalements s
                                               LEFT JOIN signal_moi.users u ON u.id = s.user_id
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

        // GET pour un utilisateur: ses propres signalements (prot�g�)
        router.get('/user/:userId', authMiddleware, async (req, res) => {
            const { userId } = req.params;
            // ? FIX: Emp�cher un utilisateur de voir les signalements d'un autre
            if (userId !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Acc�s refus�' });
            }
            try {
                const result = await db.query(`SELECT id, user_id, titre, description, type, statut, localisation, latitude, longitude, created_at, updated_at
                                               FROM signal_moi.signalements WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
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
                    createdAt: r.created_at,
                    updatedAt: r.updated_at
                }));
                res.json(rows);
            } catch (err) {
                console.error('Erreur GET /user/:userId signalements:', err);
                res.status(500).json({ error: 'Erreur serveur' });
            }
        });

        // GET detail d'un signalement specifique avec fichiers
        router.get('/:id', optionalAuthMiddleware, async (req, res) => {
            const { id } = req.params;
            try {
                const signalementResult = await db.query(`
                    SELECT s.id, s.user_id, s.titre, s.description, s.type, s.statut, s.localisation, 
                           s.latitude, s.longitude, s.image_url, s.created_at, s.updated_at,
                           u.prenom AS user_prenom, u.nom AS user_nom, u.telephone AS user_telephone, u.email AS user_email
                    FROM signal_moi.signalements s
                    LEFT JOIN signal_moi.users u ON u.id = s.user_id
                    WHERE s.id = $1
                `, [id]);

                if (signalementResult.rows.length === 0) {
                    return res.status(404).json({ error: 'Signalement non trouve' });
                }

                const signalement = signalementResult.rows[0];

                // Recuperer les fichiers
                const filesResult = await db.query(`
                    SELECT id, signalement_id, nom_fichier, chemin, type, taille, mime_type, description, created_at
                    FROM signal_moi.fichiers
                    WHERE signalement_id = $1
                    ORDER BY created_at DESC
                `, [id]);

                const fichiers = filesResult.rows.map(f => ({
                    id: f.id,
                    nom: f.nom_fichier,
                    url: f.chemin.startsWith('http') ? f.chemin : `${process.env.API_BASE_URL || 'http://localhost:3000'}/${f.chemin}`,
                    chemin: f.chemin,
                    type: f.type,
                    taille: f.taille,
                    mimeType: f.mime_type,
                    description: f.description,
                    createdAt: f.created_at
                }));

                res.json({
                    id: signalement.id,
                    titre: signalement.titre,
                    description: signalement.description,
                    type: signalement.type,
                    statut: signalement.statut,
                    localisation: signalement.localisation,
                    latitude: signalement.latitude !== null ? parseFloat(signalement.latitude) : null,
                    longitude: signalement.longitude !== null ? parseFloat(signalement.longitude) : null,
                    imageUrl: signalement.image_url,
                    telephone: signalement.user_telephone,
                    email: signalement.user_email,
                    auteur: {
                        id: signalement.user_id,
                        prenom: signalement.user_prenom,
                        nom: signalement.user_nom,
                        telephone: signalement.user_telephone,
                        email: signalement.user_email
                    },
                    fichiers: fichiers,
                    createdAt: signalement.created_at,
                    updatedAt: signalement.updated_at
                });
            } catch (err) {
                console.error('Erreur GET /:id signalement:', err);
                res.status(500).json({ error: 'Erreur serveur', details: err.message });
            }
        });

module.exports = router;




