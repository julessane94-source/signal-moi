const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const { uploadMultiple } = require('../middlewares/upload');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

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

const signalementFileUrl = (fileId, chemin) => {
    if (fileId) return `/api/signalements/fichiers/${fileId}`;
    if (!chemin) return null;
    const normalized = chemin.replace(/^[\/]+/, '');
    return normalized;
};

const mapFileRecord = (f) => ({
    id: f.id,
    signalementId: f.signalement_id,
    nom_fichier: f.nom_fichier,
    chemin: f.chemin,
    type: f.type,
    taille: f.taille,
    mime_type: f.mime_type,
    description: f.description,
    created_at: f.created_at,
    url: signalementFileUrl(f.id, f.chemin)
});

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
    const estAnonyme = req.body.estAnonyme === true || req.body.estAnonyme === 'true' || req.body.est_anonyme === true || req.body.est_anonyme === 'true';
    const user_id = req.user.id;

    // Vérifier les champs obligatoires
    if (!titre || !description || !type || !localisation) {
        return res.status(400).json({ error: 'Champs manquants : titre, description, type, localisation' });
    }

    try {
        await db.query('BEGIN');
        const result = await db.query(
            `INSERT INTO signal_moi.signalements (user_id, titre, description, type, localisation, latitude, longitude, est_anonyme)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [user_id, titre, description, type, localisation, latitude || null, longitude || null, estAnonyme]
        );
        
        console.log('[POST /signalements] Résultat complet de db.query:', JSON.stringify(result, null, 2));
        console.log('[POST /signalements] result.rows:', result.rows);
        console.log('[POST /signalements] result.rows[0]:', result.rows[0]);
        
        const signalement = Array.isArray(result.rows) ? result.rows[0] : result[0];

        if (!signalement) {
            console.error('[POST /signalements] Aucun signalement retourné');
            throw new Error('Aucun signalement créé');
        }

        console.log('[POST /signalements] Signalement obtenu:', signalement);
        console.log('[POST /signalements] Propriétés du signalement:', Object.keys(signalement || {}));

        if (signalement.id === undefined || signalement.id === null) {
            console.error('[POST /signalements] Erreur: signalement.id est undefined/null');
            console.error('[POST /signalements] Contenu du signalement:', signalement);
            throw new Error('Signalement créé sans identifiant valide');
        }

        const signalementId = signalement.id;

        // Gérer les fichiers uploadés (s'il y en a)
        if (req.files && req.files.length > 0) {
            for (const f of req.files) {
                const fileType = f.mimetype.startsWith('image') ? 'image' : f.mimetype.startsWith('video') ? 'video' : f.mimetype.startsWith('audio') ? 'audio' : 'document';
                const fileId = uuidv4();
                let chemin = f.path || `uploads/signalements/${f.filename}`;
                chemin = chemin.replace(/\\/g, '/');
                if (chemin.startsWith('/')) chemin = chemin.substring(1);
                if (!chemin.startsWith('uploads/')) chemin = `uploads/signalements/${f.filename}`;

                let fileData = null;
                try {
                    fileData = await fs.promises.readFile(f.path);
                } catch (readErr) {
                    console.error('[POST /signalements] Impossible de lire le fichier uploadé:', readErr);
                    throw readErr;
                }

                await db.query(
                    `INSERT INTO signal_moi.fichiers (id, signalement_id, nom_fichier, chemin, type, taille, mime_type, description, is_verified, uploaded_by, file_data, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
                    [fileId, signalementId, f.originalname, chemin, fileType, f.size || 0, f.mimetype, null, false, user_id, fileData]
                );

                await fs.promises.unlink(f.path).catch(() => {});
            }
        }

        await db.query('COMMIT');
        console.log('Signalement créé:', signalement);
        res.status(201).json(signalement);
    } catch (err) {
        await db.query('ROLLBACK').catch(() => {});
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                if (file.path) {
                    await fs.promises.unlink(file.path).catch(() => {});
                }
            }
        }
        console.error('Erreur SQL :', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET un fichier de signalement par id
router.get('/fichiers/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT id, nom_fichier, mime_type, taille, file_data, chemin FROM signal_moi.fichiers WHERE id = $1', [id]);
        const file = result.rows[0];
        if (!file) {
            return res.status(404).json({ error: 'Fichier introuvable' });
        }

        if (file.file_data) {
            res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
            res.setHeader('Content-Length', file.taille || 0);
            res.setHeader('Content-Disposition', `inline; filename="${file.nom_fichier}"`);
            return res.send(file.file_data);
        }

        if (file.chemin) {
            const localPath = path.resolve(__dirname, '..', '..', file.chemin);
            return res.sendFile(localPath, err => {
                if (err) {
                    console.error('[GET /fichiers/:id] Erreur envoi fichier local:', err);
                    res.status(404).json({ error: 'Fichier introuvable sur le serveur' });
                }
            });
        }

        res.status(404).json({ error: 'Fichier non disponible' });
    } catch (err) {
        console.error('[GET /fichiers/:id] Erreur:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// DELETE /api/signalements/:id - Supprimer un signalement par son auteur ou admin
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const signalementResult = await db.query('SELECT id, user_id FROM signal_moi.signalements WHERE id = $1', [id]);
        const signalement = signalementResult.rows[0];
        if (!signalement) {
            return res.status(404).json({ error: 'Signalement introuvable' });
        }

        if (req.user.role !== 'admin' && req.user.id !== signalement.user_id) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const filesResult = await db.query('SELECT chemin FROM signal_moi.fichiers WHERE signalement_id = $1', [id]);
        for (const f of filesResult.rows) {
            if (f.chemin) {
                const localPath = path.resolve(__dirname, '..', '..', f.chemin);
                await fs.promises.unlink(localPath).catch(() => {});
            }
        }

        await db.query('DELETE FROM signal_moi.fichiers WHERE signalement_id = $1', [id]);
        await db.query('DELETE FROM signal_moi.signalements WHERE id = $1', [id]);

        res.json({ success: true, message: 'Signalement supprimé' });
    } catch (err) {
        console.error('[DELETE /:id] Erreur suppression signalement:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

    // GET public: liste publique des signalements (ANONYMISÉE - pas de user_id)
        router.get('/public', async (req, res) => {
            try {
                const result = await db.query(`SELECT id, titre, description, type, statut, localisation, latitude, longitude, created_at, updated_at
                                               FROM signal_moi.signalements 
                                               ORDER BY created_at DESC LIMIT 200`);
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

                // Si c'est un collaborateur, retourner TOUS les signalements avec stats par catégorie/zone
                if (req.user && req.user.role === 'collaborateur') {
                    const result = await db.query(`SELECT s.id, s.user_id, s.titre, s.description, s.type, s.statut, s.localisation, s.latitude, s.longitude, s.created_at, s.updated_at, u.prenom AS user_prenom, u.nom AS user_nom, u.telephone AS user_telephone
                                                   FROM signal_moi.signalements s
                                                   LEFT JOIN signal_moi.users u ON u.id = s.user_id
                                                   ORDER BY s.created_at DESC LIMIT 500`);
                    
                    // Calculer les statistiques par type et localisation
                    const statsByType = {};
                    const statsByZone = {};
                    result.rows.forEach(r => {
                        // Stats par type
                        statsByType[r.type] = (statsByType[r.type] || 0) + 1;
                        // Stats par zone (première partie de localisation)
                        const zone = r.localisation ? r.localisation.split(',')[0].trim() : 'Zone inconnue';
                        statsByZone[zone] = (statsByZone[zone] || 0) + 1;
                    });

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
                    
                    return res.json({
                        signalements: rows,
                        stats: {
                            total: result.rows.length,
                            byType: statsByType,
                            byZone: statsByZone
                        }
                    });
                }

                // Si c'est un admin, retourner TOUS les signalements pour modération/suivi
                if (req.user && req.user.role === 'admin') {
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
                    return res.json(rows);
                }

                // Pas de signalements pour les utilisateurs non-authentifiés ou rôles inconnus
                res.status(403).json({ error: 'Accès refusé: authentification requise' });
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
            console.log(`[GET /:id] Recherche signalement ID: ${id}`);
            try {
                const signalementResult = await db.query(`
                    SELECT s.id, s.user_id, s.titre, s.description, s.type, s.statut, s.localisation, s.est_anonyme, s.priorite,
                           s.latitude, s.longitude, s.created_at, s.updated_at,
                           u.prenom AS user_prenom, u.nom AS user_nom, u.telephone AS user_telephone, u.email AS user_email
                    FROM signal_moi.signalements s
                    LEFT JOIN signal_moi.users u ON u.id = s.user_id
                    WHERE s.id = $1
                `, [id]);

                console.log(`[GET /:id] Résultat: ${signalementResult.rows.length} ligne(s) trouvée(s)`);
                
                if (signalementResult.rows.length === 0) {
                    console.log(`[GET /:id] Signalement ID ${id} non trouvé`);
                    return res.status(404).json({ error: 'Signalement non trouve' });
                }

                const signalement = signalementResult.rows[0];
                const isOwner = req.user && req.user.id === signalement.user_id;
                const isAdmin = req.user && req.user.role === 'admin';
                const isPolice = req.user && req.user.role === 'police';
                const isCollaborateur = req.user && req.user.role === 'collaborateur';

                console.log(`[GET /:id] Accès: isOwner=${isOwner}, isAdmin=${isAdmin}, isPolice=${isPolice}, isCollaborateur=${isCollaborateur}, estAnonyme=${signalement.est_anonyme}`);

                // Vérifier l'accès: le propriétaire, admin, police, collaborateur peuvent voir les détails
                // Les autres ne peuvent voir que si le signalement est anonyme
                if (!isOwner && !isAdmin && !isPolice && !isCollaborateur && !signalement.est_anonyme) {
                    console.log(`[GET /:id] Accès refusé pour signalement non-anonyme`);
                    return res.status(403).json({ error: 'Accès refusé' });
                }

                // Recuperer les fichiers
                const filesResult = await db.query(`
                    SELECT id, signalement_id, nom_fichier, chemin, type, taille, mime_type, description, created_at
                    FROM signal_moi.fichiers
                    WHERE signalement_id = $1
                    ORDER BY created_at DESC
                `, [id]);

                console.log(`[GET /:id] Fichiers: ${filesResult.rows.length} fichier(s) trouvé(s)`);

                const fichiers = filesResult.rows.map(f => ({
                    id: f.id,
                    nom_fichier: f.nom_fichier,
                    chemin: f.chemin,
                    type: f.type,
                    taille: f.taille,
                    mime_type: f.mime_type,
                    description: f.description,
                    created_at: f.created_at,
                    url: signalementFileUrl(f.id, f.chemin)
                }));

                // Construire la réponse en fonction du rôle
                const response = {
                    id: signalement.id,
                    titre: signalement.titre,
                    description: signalement.description,
                    type: signalement.type,
                    statut: signalement.statut,
                    priorite: signalement.priorite,
                    localisation: signalement.localisation,
                    latitude: signalement.latitude !== null ? parseFloat(signalement.latitude) : null,
                    longitude: signalement.longitude !== null ? parseFloat(signalement.longitude) : null,
                    fichiers: fichiers,
                    createdAt: signalement.created_at,
                    updatedAt: signalement.updated_at
                };

                // Ajouter les infos de l'auteur que si: propriétaire, admin, police, collaborateur, ou anonyme
                if (isOwner || isAdmin || isPolice || isCollaborateur || signalement.est_anonyme) {
                    response.user = {
                        id: signalement.user_id,
                        prenom: signalement.user_prenom,
                        nom: signalement.user_nom,
                        telephone: signalement.user_telephone,
                        email: signalement.user_email
                    };
                    response.telephone = signalement.user_telephone;
                    response.email = signalement.user_email;
                }

                console.log(`[GET /:id] Signalement retourné avec succès`);
                res.json(response);
            } catch (err) {
                console.error('Erreur GET /:id signalement:', err);
                res.status(500).json({ error: 'Erreur serveur', details: err.message });
            }
        });

// PATCH /api/signalements/:id/statut - Mettre à jour le statut
router.patch('/:id/statut', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;

        // Vérifier le rôle
        if (req.user.role !== 'police' && req.user.role !== 'collaborateur' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        // Valider le statut
        const statuts_valides = ['nouveau', 'en_cours', 'traite', 'transfere', 'closed'];
        if (!statuts_valides.includes(statut)) {
            return res.status(400).json({ error: 'Statut invalide' });
        }

        const result = await db.query(
            `UPDATE signal_moi.signalements 
             SET statut = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [statut, id]
        );

        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ error: 'Signalement non trouvé' });
        }

        console.log(`[PATCH /:id/statut] Statut mis à jour pour ${id} à ${statut}`);
        res.json({ success: true, signalement: result.rows[0] });
    } catch (err) {
        console.error('Erreur PATCH statut:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// POST /api/signalements/:id/transfert - Transférer à un autre officier police
router.post('/:id/transfert', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { police_id } = req.body;

        // Vérifier le rôle
        if (req.user.role !== 'police' && req.user.role !== 'collaborateur' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        // Vérifier que le police_id existe et est un officier police
        const policierResult = await db.query(
            `SELECT id, prenom, nom, email FROM signal_moi.users 
             WHERE id = $1 AND role = 'police'`,
            [police_id]
        );

        if (!policierResult.rows || policierResult.rows.length === 0) {
            return res.status(400).json({ error: 'Officier police invalide' });
        }

        const policier = policierResult.rows[0];

        // Vérifier que le signalement existe
        const signalementResult = await db.query(
            `SELECT * FROM signal_moi.signalements WHERE id = $1`,
            [id]
        );

        if (!signalementResult.rows || signalementResult.rows.length === 0) {
            return res.status(404).json({ error: 'Signalement non trouvé' });
        }

        const signalement = signalementResult.rows[0];

        // Mettre à jour l'attributaire si le champ existe, sinon faire un log
        // (le champ pour stocker l'assigné n'existe peut-être pas encore)
        await db.query(
            `UPDATE signal_moi.signalements 
             SET assigned_to = $1, updated_at = NOW()
             WHERE id = $2`,
            [police_id, id]
        );

        // Préparer les données pour la notification socket
        const notificationData = {
            signalement_id: id,
            transferred_by: {
                id: req.user.id,
                prenom: req.user.prenom,
                nom: req.user.nom
            },
            transferred_to: {
                id: policier.id,
                prenom: policier.prenom,
                nom: policier.nom,
                email: policier.email
            },
            titre: signalement.titre,
            type: signalement.type
        };

        console.log(`[POST /:id/transfert] Signalement ${id} transféré de ${req.user.id} à ${police_id}`);
        
        res.json({ 
            success: true, 
            message: `Dossier transféré à ${policier.prenom} ${policier.nom}`,
            notification: notificationData
        });
    } catch (err) {
        console.error('Erreur transfert:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

module.exports = router;




