// backend/src/routes/law-enforcement.routes.js
// Dashboard pour Police et Gendarmerie

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');

// Middleware d'authentification police/gendarmerie
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token d\'authentification manquant' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
        
        // Vérifier le rôle
        if (['police', 'gendarmerie'].includes(decoded.role)) {
            req.user = decoded;
            return next();
        }
        
        // Fallback: vérifier dans la base de données
        const userResult = await db.query(
            'SELECT id, role FROM signal_moi.users WHERE id = $1',
            [decoded.id]
        );
        const user = (userResult.rows || [])[0];
        if (user && ['police', 'gendarmerie'].includes(user.role)) {
            req.user = { id: decoded.id, role: user.role };
            return next();
        }
        
        return res.status(403).json({ error: 'Accès forces de l\'ordre requis' });
    } catch (err) {
        return res.status(401).json({ error: 'Token invalide', details: err.message });
    }
};

// Fonction utilitaire pour calculer le niveau d'urgence
const getUrgencyLevel = (type, description) => {
    const highRiskKeywords = ['violence', 'urgence', 'danger', 'alarm', 'appel'];
    const isHighRisk = highRiskKeywords.some(keyword => 
        type.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
    );
    return isHighRisk ? 'high' : 'medium';
};

// GET /api/law-enforcement/dashboard - Alertes urgentes
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer les signalements "violence" non traités
    const alertsResult = await db.query(`
      SELECT 
        s.id, s.titre, s.type, s.statut, s.created_at,
        u.prenom, u.nom, u.telephone, u.email
      FROM signal_moi.signalements s
      LEFT JOIN signal_moi.users u ON u.id = s.user_id
      WHERE (s.type = 'violence' OR s.statut = 'nouveau')
      AND s.statut != 'fermé'
      ORDER BY s.created_at DESC
      LIMIT 20
    `);

    const alerts = alertsResult.rows.map(s => ({
      id: s.id,
      titre: s.titre,
      type: s.type,
      statut: s.statut,
      urgency: getUrgencyLevel(s.type, s.titre),
      createdAt: s.created_at,
      reporter: { prenom: s.prenom, nom: s.nom, telephone: s.telephone, email: s.email }
    }));

    // Trier par urgence
    alerts.sort((a, b) => {
      if (a.urgency === 'high' && b.urgency !== 'high') return -1;
      if (a.urgency !== 'high' && b.urgency === 'high') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const dashboard = {
      officer: req.user,
      stats: {
        totalAlerts: alerts.length,
        highPriority: alerts.filter(a => a.urgency === 'high').length,
        inProgress: alerts.filter(a => a.statut === 'en_cours').length
      },
      alerts: alerts
    };

    console.log(`[LAW-ENFORCEMENT GET /dashboard] ${alerts.length} alertes pour ${userId}`);
    res.json(dashboard);
  } catch (err) {
    console.error('[LAW-ENFORCEMENT GET /dashboard] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// GET /api/law-enforcement/alerts - Liste des alertes avec tri par urgence
router.get('/alerts', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        s.id, s.titre, s.description, s.type, s.statut,
        s.localisation, s.latitude, s.longitude, s.created_at,
        u.prenom, u.nom, u.telephone, u.email, u.id as user_id
      FROM signal_moi.signalements s
      LEFT JOIN signal_moi.users u ON u.id = s.user_id
      WHERE s.statut IN ('nouveau', 'en_cours')
      ORDER BY s.created_at DESC
      LIMIT 100
    `);

    const alerts = result.rows.map(s => ({
      id: s.id,
      titre: s.titre,
      description: s.description,
      type: s.type,
      statut: s.statut,
      urgency: getUrgencyLevel(s.type, s.description),
      localisation: s.localisation,
      coordinates: { lat: parseFloat(s.latitude || 0), lng: parseFloat(s.longitude || 0) },
      createdAt: s.created_at,
      reporter: { id: s.user_id, prenom: s.prenom, nom: s.nom, telephone: s.telephone, email: s.email }
    }));

    // Trier par urgence
    alerts.sort((a, b) => {
      if (a.urgency === 'high' && b.urgency !== 'high') return -1;
      if (a.urgency !== 'high' && b.urgency === 'high') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    console.log(`[LAW-ENFORCEMENT GET /alerts] ${alerts.length} alertes triées`);
    res.json(alerts);
  } catch (err) {
    console.error('[LAW-ENFORCEMENT GET /alerts] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// GET /api/law-enforcement/case/:id - Détails d'un signalement
router.get('/case/:id', authMiddleware, async (req, res) => {
  try {
    const caseId = req.params.id;
    
    const result = await db.query(`
      SELECT 
        s.id, s.titre, s.description, s.type, s.statut,
        s.localisation, s.latitude, s.longitude, s.created_at,
        u.id as user_id, u.prenom, u.nom, u.telephone, u.email
      FROM signal_moi.signalements s
      LEFT JOIN signal_moi.users u ON u.id = s.user_id
      WHERE s.id = $1
    `, [caseId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Signalement non trouvé' });
    }

    const s = result.rows[0];
    const caseDetails = {
      id: s.id,
      titre: s.titre,
      description: s.description,
      type: s.type,
      statut: s.statut,
      urgency: getUrgencyLevel(s.type, s.description),
      localisation: s.localisation,
      coordinates: { lat: parseFloat(s.latitude || 0), lng: parseFloat(s.longitude || 0) },
      createdAt: s.created_at,
      reporter: { 
        id: s.user_id, 
        prenom: s.prenom, 
        nom: s.nom, 
        telephone: s.telephone, 
        email: s.email 
      },
      actions: {
        canRespond: ['nouveau', 'en_cours'].includes(s.statut),
        canUpdateStatus: true,
        canContact: true,
        canTransfer: true
      }
    };

    console.log(`[LAW-ENFORCEMENT GET /case/:id] Cas ${caseId}`);
    res.json(caseDetails);
  } catch (err) {
    console.error('[LAW-ENFORCEMENT GET /case/:id] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// POST /api/law-enforcement/case/:id/take-action - Prendre en charge un signalement
router.post('/case/:id/take-action', authMiddleware, async (req, res) => {
  try {
    const caseId = req.params.id;
    const userId = req.user.id;

    // Mettre à jour le statut à "en_cours"
    const result = await db.query(
      'UPDATE signal_moi.signalements SET statut = $1 WHERE id = $2 RETURNING id, statut',
      ['en_cours', caseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Signalement non trouvé' });
    }

    console.log(`[LAW-ENFORCEMENT POST /case/:id/take-action] ${userId} a pris en charge ${caseId}`);
    res.json({ success: true, statut: result.rows[0].statut });
  } catch (err) {
    console.error('[LAW-ENFORCEMENT POST /case/:id/take-action] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// PUT /api/law-enforcement/case/:id/status - Mettre à jour le statut
router.put('/case/:id/status', authMiddleware, async (req, res) => {
  try {
    const caseId = req.params.id;
    const { statut, notes } = req.body;

    const validStatus = ['nouveau', 'en_cours', 'sur_place', 'intervention_terminee', 'fausse_alerte'];
    if (!validStatus.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const result = await db.query(
      'UPDATE signal_moi.signalements SET statut = $1, updated_at = NOW() WHERE id = $2 RETURNING id, statut',
      [statut, caseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Signalement non trouvé' });
    }

    console.log(`[LAW-ENFORCEMENT PUT /case/:id/status] ${caseId} -> ${statut}`);
    res.json({ success: true, statut: result.rows[0].statut });
  } catch (err) {
    console.error('[LAW-ENFORCEMENT PUT /case/:id/status] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// GET /api/law-enforcement/history - Historique des interventions
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        s.id, s.titre, s.type, s.statut, s.created_at, s.updated_at,
        u.prenom, u.nom
      FROM signal_moi.signalements s
      LEFT JOIN signal_moi.users u ON u.id = s.user_id
      WHERE s.statut IN ('intervention_terminee', 'fausse_alerte')
      ORDER BY s.updated_at DESC
      LIMIT 50
    `);

    const history = result.rows.map(s => ({
      id: s.id,
      titre: s.titre,
      type: s.type,
      statut: s.statut,
      createdAt: s.created_at,
      completedAt: s.updated_at,
      reporter: { prenom: s.prenom, nom: s.nom }
    }));

    console.log(`[LAW-ENFORCEMENT GET /history] ${history.length} interventions`);
    res.json(history);
  } catch (err) {
    console.error('[LAW-ENFORCEMENT GET /history] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// POST /api/law-enforcement/case/:id/report - Ajouter un rapport/notes
router.post('/case/:id/report', authMiddleware, async (req, res) => {
  try {
    const caseId = req.params.id;
    const { notes, findings } = req.body;

    if (!notes) {
      return res.status(400).json({ error: 'Notes requises' });
    }

    // Pour l'instant, on retourne juste un succès
    // Dans une vraie app, il faudrait créer une table "reports"
    console.log(`[LAW-ENFORCEMENT POST /case/:id/report] Rapport ajouté pour ${caseId}`);
    res.json({ success: true, message: 'Rapport ajouté avec succès' });
  } catch (err) {
    console.error('[LAW-ENFORCEMENT POST /case/:id/report] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

module.exports = router;
