const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Middleware d'authentification optionnelle
const optionalAuthMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
            req.user = decoded;
        }
        next();
    } catch (err) {
        // Token invalide mais on continue (optionnel)
        next();
    }
};

// Middleware d'authentification stricte (obligatoire)
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
    const result = await db.query(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM signal_moi.signatures_plaidoyers WHERE plaidoyer_id = p.id) as nombre_signatures_auth,
        (SELECT COUNT(*) FROM signal_moi.signatures_plaidoyers_anonymes WHERE plaidoyer_id = p.id) as nombre_signatures_anonymes
      FROM signal_moi.plaidoyers p
      ORDER BY p.created_at DESC
    `);
    
    const plaidoyers = result.rows.map(p => ({
      ...p,
      nombre_signatures_total: (parseInt(p.nombre_signatures_auth) || 0) + (parseInt(p.nombre_signatures_anonymes) || 0)
    }));
    
    res.json(plaidoyers);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// GET /api/plaidoyers/:id - Détail d'un plaidoyer avec stats
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM signal_moi.signatures_plaidoyers WHERE plaidoyer_id = p.id) as nombre_signatures_auth,
        (SELECT COUNT(*) FROM signal_moi.signatures_plaidoyers_anonymes WHERE plaidoyer_id = p.id) as nombre_signatures_anonymes
      FROM signal_moi.plaidoyers p
      WHERE p.id = $1
    `, [id]);
    
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Plaidoyer non trouvé' });
    }
    
    const plaidoyer = result.rows[0];
    const response = {
      ...plaidoyer,
      nombre_signatures_total: (parseInt(plaidoyer.nombre_signatures_auth) || 0) + (parseInt(plaidoyer.nombre_signatures_anonymes) || 0)
    };
    
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// POST - Créer un plaidoyer (collaborateurs et admin)
router.post('/', authMiddleware, async (req, res) => {
    const { titre, description, categorie, objectif_signatures } = req.body;
    
    // Vérifier que l'utilisateur est collaborateur ou admin
    if (req.user.role !== 'collaborateur' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Seuls les collaborateurs et admins peuvent créer des plaidoyers' });
    }
    
    // Valider les champs obligatoires
    if (!titre || !description || !categorie) {
        return res.status(400).json({ error: 'Titre, description et catégorie sont obligatoires' });
    }

    const plaidoyerId = uuidv4();
    const objectif = objectif_signatures || 1000;
    
    try {
        const result = await db.query(
            `INSERT INTO signal_moi.plaidoyers (id, titre, description, contenu, categorie, objectif_signatures, auteur_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             RETURNING *`,
            [plaidoyerId, titre, description, description, categorie, objectif, req.user.id]
        );
        
        res.status(201).json({
            success: true,
            message: 'Plaidoyer créé avec succès',
            plaidoyer: result.rows[0]
        });
    } catch (err) {
        console.error('Erreur POST /:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// GET les plaidoyers signes par un utilisateur
router.get('/signed/user/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params;
    
    try {
        const result = await db.query(`
            SELECT p.* FROM signal_moi.plaidoyers p
            INNER JOIN signal_moi.signatures_plaidoyers sp ON sp.plaidoyer_id = p.id
            WHERE sp.user_id = $1
            ORDER BY sp.date_signature DESC
        `, [userId]);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur GET /signed/user/:userId:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

// POST - Signer un plaidoyer (citoyen, collaborateur, ou public anonyme)
router.post('/:id/sign', optionalAuthMiddleware, async (req, res) => {
    const { id } = req.params;
    const { nom, email } = req.body; // Pour les signatures anonymes
    
    try {
        // Vérifier que le plaidoyer existe
        const plaidoyerResult = await db.query('SELECT * FROM signal_moi.plaidoyers WHERE id = $1', [id]);
        if (plaidoyerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Plaidoyer non trouve' });
        }

        // Cas 1: Utilisateur authentifié
        if (req.user) {
            const user_id = req.user.id;
            
            // Vérifier que l'utilisateur n'a pas déjà signé
            const existingResult = await db.query(
                'SELECT * FROM signal_moi.signatures_plaidoyers WHERE plaidoyer_id = $1 AND user_id = $2',
                [id, user_id]
            );
            
            if (existingResult.rows.length > 0) {
                return res.status(400).json({ error: 'Vous avez deja signe ce plaidoyer' });
            }

            // Ajouter la signature
            const signatureId = uuidv4();
            const result = await db.query(
                `INSERT INTO signal_moi.signatures_plaidoyers (id, plaidoyer_id, user_id, date_signature)
                 VALUES ($1, $2, $3, NOW())
                 RETURNING *`,
                [signatureId, id, user_id]
            );

            return res.json({
                success: true,
                message: 'Plaidoyer signe avec succes',
                signature: result.rows[0]
            });
        }

        // Cas 2: Utilisateur anonyme (public sans compte)
        if (!req.user) {
            if (!nom || !email) {
                return res.status(400).json({ error: 'Nom et email requis pour signature anonyme' });
            }

            // Vérifier que cet email n'a pas déjà signé
            const anonResult = await db.query(
                `SELECT * FROM signal_moi.signatures_plaidoyers_anonymes 
                 WHERE plaidoyer_id = $1 AND email = $2`,
                [id, email]
            );
            
            if (anonResult.rows && anonResult.rows.length > 0) {
                return res.status(400).json({ error: 'Vous avez deja signe ce plaidoyer' });
            }

            // Ajouter la signature anonyme
            const anonSigId = uuidv4();
            const anonResult2 = await db.query(
                `INSERT INTO signal_moi.signatures_plaidoyers_anonymes (id, plaidoyer_id, nom, email, date_signature)
                 VALUES ($1, $2, $3, $4, NOW())
                 RETURNING *`,
                [anonSigId, id, nom, email]
            );

            return res.json({
                success: true,
                message: 'Plaidoyer signe avec succes (anonyme)',
                signature: anonResult2.rows[0]
            });
        }
    } catch (err) {
        console.error('Erreur POST /:id/sign:', err);
        // Si la table anonyme n'existe pas, créer juste la signature du citoyen
        if (err.message.includes('signatures_plaidoyers_anonymes')) {
            console.warn('⚠️ Table signatures_plaidoyers_anonymes non trouvée. Migration nécessaire.');
            return res.status(500).json({ error: 'Base de données non à jour', details: 'Migration requise' });
        }
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

module.exports = router;
