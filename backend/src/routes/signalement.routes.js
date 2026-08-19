const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const { uploadMultiple } = require('../middlewares/upload');
const { v4: uuidv4 } = require('uuid');
const { signalementLimiter, uploadLimiter } = require('../middlewares/security');
const { validateUploadedMedia } = require('../middlewares/validateUploadedMedia');
const FollowedCase = require('../models/FollowedCase');
const fs = require('fs');
const path = require('path');
const { dispatchLiveToStation } = require('../utils/policeDispatch');
const { activeLiveSessions } = require('../utils/liveSessions');
const mediaCacheHeader = 'public, max-age=31536000, immutable';
const publicListCacheHeader = 'public, max-age=30, stale-while-revalidate=120';
const parseLimit = (value, fallback = 100, max = 500) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) return fallback;
    return Math.min(parsed, max);
};

const normalizeRole = (role) => String(role || '').trim().toLowerCase();
const isPoliceLikeRole = (role) => ['commissariat', 'police', 'policier', 'gendarmerie', 'force_ordre'].includes(normalizeRole(role));
const canViewLiveSessions = (role) => ['admin', 'administrateur'].includes(normalizeRole(role)) || isPoliceLikeRole(role);
const canAccessLiveSession = (user, session) => {
    const role = normalizeRole(user?.role);
    if (['admin', 'administrateur', 'commissariat'].includes(role)) return true;
    const recipientIds = Array.isArray(session?.assignedRecipientIds) ? session.assignedRecipientIds.map(String) : [];
    return recipientIds.includes(String(user?.id));
};
const liveSessionPayload = (session) => {
    // Les fragments video sont livres par Socket.IO au commissariat. Ne pas
    // les inclure dans le polling HTTP evite de ralentir le tableau de bord.
    const { videoChunks, ...payload } = session || {};
    return {
        ...payload,
        isLiveRecording: true,
        status: session.status || 'recording'
    };
};
const pruneLiveSessions = () => {
    const now = Date.now();
    for (const [sessionId, session] of activeLiveSessions.entries()) {
        const lastSeen = new Date(session.frameAt || session.updatedAt || session.startedAt || 0).getTime();
        if (!lastSeen || now - lastSeen > 45000 || session.status === 'stopped') {
            activeLiveSessions.delete(sessionId);
        }
    }
};

// Middleware d'authentification
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token d\'authentification manquant' });
        }
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await db.query(
            'SELECT id, role, is_active, quartier FROM signal_moi.users WHERE id = $1',
            [decoded.id]
        );
        const user = result.rows[0];
        if (!user || user.is_active === false) {
            return res.status(401).json({ error: 'Compte utilisateur indisponible' });
        }
        req.user = user;
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

const buildVerificationInfo = (signalement, fichiers = []) => {
    const reasons = [];
    let score = 100;
    const fileCount = Array.isArray(fichiers) ? fichiers.length : Number(signalement.file_count || 0);
    const hasGps = signalement.latitude !== null && signalement.latitude !== undefined && signalement.longitude !== null && signalement.longitude !== undefined;
    const duplicateCount = Number(signalement.recent_same_user_count || 0);
    const createdAt = signalement.user_created_at ? new Date(signalement.user_created_at).getTime() : null;
    const accountAgeHours = createdAt ? Math.max(0, (Date.now() - createdAt) / 36e5) : null;

    if (!hasGps) {
        score -= 25;
        reasons.push('Localisation GPS absente ou incomplete');
    }
    if (fileCount === 0) {
        score -= 20;
        reasons.push('Aucune preuve jointe');
    }
    if (duplicateCount >= 3) {
        score -= 25;
        reasons.push('Plusieurs signalements recents depuis ce compte');
    } else if (duplicateCount >= 2) {
        score -= 10;
        reasons.push('Signalements rapproches depuis ce compte');
    }
    if (accountAgeHours !== null && accountAgeHours < 24) {
        score -= 15;
        reasons.push('Compte cree recemment');
    }
    if (signalement.statut === 'fausse_alerte') {
        score = Math.min(score, 20);
        reasons.push('Dossier marque comme fausse alerte');
    }

    const safeScore = Math.max(0, Math.min(100, score));
    const level = safeScore >= 75 ? 'fiable' : safeScore >= 45 ? 'a_verifier' : 'suspect';

    return {
        score: safeScore,
        niveau: level,
        raisons: reasons.length ? reasons : ['Aucun signal faible majeur detecte'],
        preuves: fileCount,
        gps: hasGps,
        doublonsRecents: duplicateCount,
        compteRecent: accountAgeHours !== null && accountAgeHours < 24
    };
};

// Middleware d'authentification optionnelle
const optionalAuthMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return next();
    }
    try {
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        // Ignorer le token invalide ; continuer sans utilisateur
    }
    next();
};

router.post('/', authMiddleware, signalementLimiter, uploadLimiter, ...uploadMultiple('fichiers', 5), validateUploadedMedia, async (req, res) => {
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
        // Un nouveau dossier reste volontairement non affecte. Tous les
        // commissariats peuvent le voir ; le premier qui le prend en charge
        // devient ensuite responsable de son suivi.

        // Notify only collaborators configured by the administrator for this type.
        try {
            const recipients = await db.query(
                `SELECT cst.collaborator_id
                 FROM signal_moi.collaborator_signalement_types cst
                 JOIN signal_moi.users u ON u.id = cst.collaborator_id
                 WHERE cst.type_code = $1 AND u.is_active = true`,
                [signalement.type]
            );
            if (global.io) {
                recipients.rows.forEach(({ collaborator_id }) => {
                    global.io.to(`user_${collaborator_id}`).emit('signalement_received', {
                        id: signalement.id,
                        titre: signalement.titre,
                        title: signalement.titre,
                        type: signalement.type,
                        localisation: signalement.localisation,
                        timestamp: new Date()
                    });
                });
            }
        } catch (notificationError) {
            // The report is still valid when the optional routing migration is not applied yet.
            if (notificationError.code !== '42P01') console.warn('[POST /signalements] Notification collaborateurs:', notificationError.message);
        }

        // Gérer les fichiers uploadés (s'il y en a)
        // Le formulaire citoyen utilise l'API REST : émettre l'événement ici
        // garantit que le tableau de bord police se rafraîchit immédiatement.
        if (global.io) {
            const policeNotification = {
                id: signalement.id,
                titre: signalement.titre,
                title: signalement.titre,
                type: signalement.type,
                localisation: signalement.localisation,
                priorite: signalement.priorite,
                timestamp: new Date()
            };
            // Aucun commissariat n'est choisi automatiquement : toute la file
            // commissariat reçoit l'alerte et le premier poste disponible la prend.
            global.io.to('commissariat_room').emit('signalement_received', policeNotification);
            global.io.to('admin_room').emit('new_signalement_notification', policeNotification);
        }

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
router.get('/fichiers/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            `SELECT f.id, f.nom_fichier, f.mime_type, f.taille, f.file_data, f.chemin,
                    s.user_id, s.assigned_to, s.type
             FROM signal_moi.fichiers f
             JOIN signal_moi.signalements s ON s.id = f.signalement_id
             WHERE f.id = $1`,
            [id]
        );
        const file = result.rows[0];
        if (!file) {
            return res.status(404).json({ error: 'Fichier introuvable' });
        }

        const role = normalizeRole(req.user.role);
        const isOwner = String(file.user_id) === String(req.user.id);
        const isPrivileged = ['admin', 'administrateur', 'collaborateur'].includes(role);
        let isAssignedPolice = false;
        if (isPoliceLikeRole(role)) {
            // Les dossiers sans affectation restent visibles dans la file
            // police ; leurs preuves suivent donc la meme autorisation.
            if (!file.assigned_to || String(file.assigned_to) === String(req.user.id)) {
                isAssignedPolice = true;
            } else {
                const station = await db.query(
                    `SELECT id FROM signal_moi.users
                     WHERE LOWER(role) = 'commissariat'
                       AND LOWER(COALESCE(quartier, '')) = LOWER(COALESCE($1, ''))
                     LIMIT 1`,
                    [req.user.quartier]
                );
                isAssignedPolice = String(file.assigned_to || '') === String(station.rows[0]?.id || '');
            }
        }
        if (!isOwner && !isPrivileged && !isAssignedPolice) {
            return res.status(403).json({ error: 'Accès à cette preuve refusé' });
        }

        if (file.file_data) {
            const mimeType = file.mime_type || 'application/octet-stream';
            const isPreviewableMedia = /^(image|audio|video)\//.test(mimeType);
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Length', file.taille || 0);
            // Les documents sont téléchargés au lieu d'être exécutés dans le navigateur.
            const safeFilename = String(file.nom_fichier || 'preuve').replace(/[\r\n"]/g, '_');
            res.setHeader('Content-Disposition', `${isPreviewableMedia ? 'inline' : 'attachment'}; filename="${safeFilename}"`);
            res.setHeader('X-Content-Type-Options', 'nosniff');
            if (!isPreviewableMedia) res.setHeader('Content-Security-Policy', 'sandbox');
            res.setHeader('Cache-Control', mediaCacheHeader);
            return res.send(file.file_data);
        }

        if (file.chemin) {
            const localPath = path.resolve(__dirname, '..', '..', file.chemin);
            res.setHeader('Cache-Control', mediaCacheHeader);
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
                const limit = parseLimit(req.query.limit, 100, 200);
                const result = await db.query(`SELECT id, titre, description, type, statut, localisation, latitude, longitude, created_at, updated_at
                                               FROM signal_moi.signalements
                                               WHERE COALESCE(statut, 'nouveau') <> 'fausse_alerte'
                                               ORDER BY created_at DESC LIMIT $1`, [limit]);
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
                res.set('Cache-Control', publicListCacheHeader);
                res.json(rows);
            } catch (err) {
                console.error('Erreur GET /public signalements:', err);
                res.status(500).json({ error: 'Erreur serveur' });
            }
        });

        // GET g�n�rique: signalements selon le r�le / utilisateur
        router.get('/policiers', authMiddleware, async (req, res) => {
            try {
                if (!['commissariat', 'police', 'admin', 'collaborateur'].includes(req.user.role)) {
                    return res.status(403).json({ error: 'Acces refuse' });
                }

                const restrictToStation = normalizeRole(req.user.role) === 'commissariat';
                const result = await db.query(
                    `SELECT id, prenom, nom, email, telephone, ville, quartier
                     FROM signal_moi.users
                     WHERE role = 'police'
                       AND is_active = true
                       AND id <> $1
                       AND ($2::boolean = false OR LOWER(COALESCE(quartier, '')) = LOWER(COALESCE($3, '')))
                     ORDER BY nom ASC, prenom ASC
                     LIMIT 200`,
                    [req.user.id, restrictToStation, req.user.quartier || '']
                );

                res.json(result.rows);
            } catch (err) {
                console.error('Erreur GET /policiers:', err);
                res.status(500).json({ error: 'Erreur serveur' });
            }
        });

        router.get('/live-sessions', authMiddleware, async (req, res) => {
            try {
                if (!canViewLiveSessions(req.user.role)) {
                    return res.status(403).json({ error: 'Acces refuse' });
                }

                pruneLiveSessions();
                const sessions = Array.from(activeLiveSessions.values())
                    .filter((session) => canAccessLiveSession(req.user, session))
                    .map(liveSessionPayload)
                    .sort((a, b) => new Date(b.frameAt || b.updatedAt || b.startedAt || 0) - new Date(a.frameAt || a.updatedAt || a.startedAt || 0));

                res.json({ success: true, sessions });
            } catch (err) {
                console.error('Erreur GET /live-sessions:', err);
                res.status(500).json({ error: 'Erreur serveur' });
            }
        });

        router.post('/live-session', authMiddleware, async (req, res) => {
            try {
                if (normalizeRole(req.user.role) !== 'citoyen') {
                    return res.status(403).json({ error: 'Seuls les citoyens peuvent demarrer un direct.' });
                }
                const { action = 'frame', sessionId, frame, type, titre, description, latitude, longitude, localisation } = req.body || {};
                if (!sessionId) {
                    return res.status(400).json({ error: 'sessionId requis' });
                }

                const now = new Date();
                const existing = activeLiveSessions.get(sessionId) || {};
                const payload = {
                    ...existing,
                    sessionId,
                    type: type || existing.type,
                    titre: titre || existing.titre,
                    description: description || existing.description,
                    latitude: latitude !== undefined ? latitude : existing.latitude,
                    longitude: longitude !== undefined ? longitude : existing.longitude,
                    localisation: localisation || existing.localisation,
                    citizenId: req.user.id,
                    citizenName: existing.citizenName || `${req.user.prenom || ''} ${req.user.nom || ''}`.trim(),
                    status: action === 'stop' ? 'stopped' : 'recording',
                    startedAt: existing.startedAt || now,
                    updatedAt: now
                };

                if (frame) {
                    payload.frame = frame;
                    payload.frameAt = now;
                }

                if (action === 'stop') {
                    activeLiveSessions.delete(sessionId);
                } else {
                    activeLiveSessions.set(sessionId, payload);
                }

                if (global.io) {
                    const eventPayload = liveSessionPayload(payload);
                    const event = action === 'stop' ? 'live_recording_stopped' : frame ? 'live_recording_frame' : 'live_recording_started';
                    const dispatchedPayload = await dispatchLiveToStation(global.io, eventPayload, event);
                    if (dispatchedPayload) activeLiveSessions.set(sessionId, dispatchedPayload);
                }

                res.json({ success: true });
            } catch (err) {
                console.error('Erreur POST /live-session:', err);
                res.status(500).json({ error: 'Erreur serveur' });
            }
        });

        router.get('/', optionalAuthMiddleware, async (req, res) => {
            try {
                const limit = parseLimit(req.query.limit, 100, 500);
                if (req.user && req.user.role === 'citoyen') {
                    const result = await db.query(`SELECT id, user_id, titre, description, type, statut, localisation, latitude, longitude, created_at, updated_at
                                                   FROM signal_moi.signalements WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`, [req.user.id, limit]);
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
                if (req.user && isPoliceLikeRole(req.user.role)) {
                    const showArchive = String(req.query.archive || '').toLowerCase() === 'true';
                    const statusFilter = showArchive
                        ? "s.statut IN ('traite', 'closed', 'fausse_alerte')"
                        : "COALESCE(s.statut, 'nouveau') NOT IN ('traite', 'closed', 'fausse_alerte')";
                    const baseSelect = `SELECT s.id, s.user_id, s.titre, s.description, s.type, s.statut, s.localisation, s.latitude, s.longitude, s.priorite, s.est_anonyme, s.created_at, s.updated_at,
                                                          u.prenom AS user_prenom, u.nom AS user_nom, u.telephone AS user_telephone, u.email AS user_email, u.created_at AS user_created_at,
                                                          (SELECT COUNT(*)::int FROM signal_moi.signalements sx WHERE sx.user_id = s.user_id AND sx.created_at >= NOW() - INTERVAL '24 hours') AS recent_same_user_count
                                                   FROM signal_moi.signalements s
                                                   LEFT JOIN signal_moi.users u ON u.id = s.user_id`;
                    // Les signalements plus anciens, ceux sans GPS et ceux créés avant la
                    // migration n'ont pas encore de commissariat attribué. Ils doivent rester
                    // visibles dans la file de police au lieu de disparaître.
                    const recipientFilter = `(
                      s.assigned_to = COALESCE(
                                                     (SELECT CASE WHEN LOWER(me.role) = 'commissariat' THEN me.id
                                                       ELSE (SELECT c.id FROM signal_moi.users c WHERE LOWER(c.role) = 'commissariat' AND LOWER(COALESCE(c.quartier, '')) = LOWER(COALESCE(me.quartier, '')) LIMIT 1)
                                                     END FROM signal_moi.users me WHERE me.id = $1), $1::uuid)
                      OR s.assigned_to IS NULL
                    )`;

                    let result;
                    try {
                        result = await db.query(`${baseSelect}
                                                   WHERE ${recipientFilter}
                                                     AND (NOT EXISTS (SELECT 1 FROM signal_moi.police_signalement_types pst WHERE pst.recipient_id = s.assigned_to)
                                                       OR EXISTS (SELECT 1 FROM signal_moi.police_signalement_types pst WHERE pst.recipient_id = s.assigned_to AND pst.type_code = s.type))
                                                     AND ${statusFilter}
                                                   ORDER BY s.created_at DESC LIMIT $2`, [req.user.id, limit]);
                    } catch (routingError) {
                        // La migration 015 peut ne pas être encore exécutée en production.
                        // Dans ce cas, afficher la file existante plutôt que retourner une page vide.
                        if (routingError.code !== '42P01') throw routingError;
                        result = await db.query(`${baseSelect}
                                                   WHERE ${recipientFilter}
                                                     AND ${statusFilter}
                                                   ORDER BY s.created_at DESC LIMIT $2`, [req.user.id, limit]);
                    }
                    const signalementIds = result.rows.map(r => r.id);
                    const filesBySignalement = {};

                    if (signalementIds.length > 0) {
                        const filesRes = await db.query(
                            `SELECT id, signalement_id, nom_fichier, chemin, type, taille, mime_type, description
                             FROM signal_moi.fichiers
                             WHERE signalement_id = ANY($1::uuid[])
                             ORDER BY created_at DESC`,
                            [signalementIds]
                        );

                        filesRes.rows.forEach((f) => {
                            if (!filesBySignalement[f.signalement_id]) {
                                filesBySignalement[f.signalement_id] = [];
                            }
                            filesBySignalement[f.signalement_id].push({
                                id: f.id,
                                nom_fichier: f.nom_fichier,
                                chemin: f.chemin,
                                type: f.type,
                                mime_type: f.mime_type,
                                taille: f.taille,
                                description: f.description,
                                url: signalementFileUrl(f.id, f.chemin)
                            });
                        });
                    }

                    const rows = result.rows.map((r) => {
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
                            fichiers: filesBySignalement[r.id] || [],
                            verification: buildVerificationInfo(r, filesBySignalement[r.id] || [])
                        };
                    });
                    return res.json(rows);
                }

                // Si c'est un collaborateur, retourner TOUS les signalements avec stats par catégorie/zone
                if (req.user && req.user.role === 'collaborateur') {
                    const result = await db.query(`SELECT s.id, s.user_id, s.titre, s.description, s.type, s.statut, s.localisation, s.latitude, s.longitude, s.created_at, s.updated_at, u.prenom AS user_prenom, u.nom AS user_nom, u.telephone AS user_telephone
                                                   FROM signal_moi.signalements s
                                                   LEFT JOIN signal_moi.users u ON u.id = s.user_id
                                                   ORDER BY s.created_at DESC LIMIT $1`, [limit]);
                    
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
                                                   ORDER BY s.created_at DESC LIMIT $1`, [limit]);
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
                           s.latitude, s.longitude, s.assigned_to, s.created_at, s.updated_at,
                           u.prenom AS user_prenom, u.nom AS user_nom, u.telephone AS user_telephone, u.email AS user_email, u.created_at AS user_created_at,
                           (SELECT COUNT(*)::int FROM signal_moi.signalements sx WHERE sx.user_id = s.user_id AND sx.created_at >= NOW() - INTERVAL '24 hours') AS recent_same_user_count,
                           officer.prenom AS officer_prenom, officer.nom AS officer_nom, officer.telephone AS officer_telephone, officer.email AS officer_email
                    FROM signal_moi.signalements s
                    LEFT JOIN signal_moi.users u ON u.id = s.user_id
                    LEFT JOIN signal_moi.users officer ON officer.id::text = s.assigned_to::text
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
                const isPolice = req.user && ['commissariat', 'police'].includes(req.user.role);
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

                const collaborators = (isOwner || isAdmin || isPolice || isCollaborateur)
                    ? await FollowedCase.followersDetailsByCase(id)
                    : [];

                let historique = [];
                try {
                    const historyResult = await db.query(`
                        SELECT action, ancien_statut, nouveau_statut, created_at
                        FROM signal_moi.historiques_signalements
                        WHERE signalement_id = $1
                        ORDER BY created_at ASC
                    `, [id]);
                    historique = historyResult.rows.map(row => ({
                        action: row.action,
                        ancienStatut: row.ancien_statut,
                        nouveauStatut: row.nouveau_statut,
                        createdAt: row.created_at
                    }));
                } catch (historyError) {
                    console.warn(`[GET /:id] Historique non disponible pour ${id}: ${historyError.message}`);
                }

                const policeStatus = {
                    assigned: Boolean(signalement.assigned_to),
                    assignedTo: signalement.assigned_to ? {
                        id: signalement.assigned_to,
                        prenom: signalement.officer_prenom,
                        nom: signalement.officer_nom,
                        telephone: signalement.officer_telephone,
                        email: signalement.officer_email
                    } : null,
                    currentStatus: signalement.statut,
                    receivedAt: signalement.created_at,
                    lastUpdateAt: signalement.updated_at
                };

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
                    collaborators,
                    followers: collaborators,
                    policeStatus,
                    historique,
                    createdAt: signalement.created_at,
                    updatedAt: signalement.updated_at,
                    estAnonyme: signalement.est_anonyme,
                    verification: buildVerificationInfo(signalement, fichiers)
                };

                // Ajouter les infos de l'auteur que si: propriétaire, admin, police, collaborateur, ou anonyme
                if (isOwner || isAdmin || isPolice || isCollaborateur) {
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
        if (req.user.role !== 'commissariat' && req.user.role !== 'police' && req.user.role !== 'collaborateur' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        // Valider le statut
        const statuts_valides = ['nouveau', 'en_cours', 'traite', 'transfere', 'closed', 'fausse_alerte'];
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
        const updatedSignalement = result.rows[0];
        if (global.io) {
            const statusPayload = {
                signalementId: id,
                nouveauStatut: statut,
                titre: updatedSignalement.titre,
                message: `Le statut du signalement est maintenant: ${statut}`,
                updatedAt: new Date()
            };
            if (updatedSignalement.user_id) {
                global.io.to(`user_${updatedSignalement.user_id}`).emit('status_updated', statusPayload);
            }
            global.io.to('admin_room').emit('signalement_status_updated', statusPayload);
            global.io.to('collaborateur_room').emit('followed_case_update', statusPayload);
        }
        res.json({ success: true, signalement: updatedSignalement });
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
        if (req.user.role !== 'commissariat' && req.user.role !== 'collaborateur' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        // Vérifier que le police_id existe et est un officier police
        const restrictToStation = normalizeRole(req.user.role) === 'commissariat';
        const policierResult = await db.query(
            `SELECT id, prenom, nom, email FROM signal_moi.users 
             WHERE id = $1 AND role = 'police' AND is_active = true
               AND ($2::boolean = false OR LOWER(COALESCE(quartier, '')) = LOWER(COALESCE($3, '')))`,
            [police_id, restrictToStation, req.user.quartier || '']
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
