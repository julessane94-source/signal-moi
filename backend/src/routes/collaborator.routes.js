// backend/src/routes/collaborator.routes.js
// Dashboard pour les collaborateurs (ONG, Association)

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const FollowedCase = require('../models/FollowedCase');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Middleware d'authentification collaborateur
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token d\'authentification manquant' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
        
        // Vérifier le rôle
        if (decoded.role === 'collaborateur') {
            req.user = decoded;
            return next();
        }
        
        // Fallback: vérifier dans la base de données
        const userResult = await db.query(
            'SELECT id, role FROM signal_moi.users WHERE id = $1',
            [decoded.id]
        );
        const user = (userResult.rows || [])[0];
        if (user && user.role === 'collaborateur') {
            req.user = { id: decoded.id, role: 'collaborateur' };
            return next();
        }
        
        return res.status(403).json({ error: 'Accès collaborateur requis' });
    } catch (err) {
        return res.status(401).json({ error: 'Token invalide', details: err.message });
    }
};

// GET /api/collaborator/dashboard - Vue d'ensemble du tableau de bord
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer les stats
    const [signalementCount, campaignCount, notificationCount] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM signal_moi.signalements WHERE user_id = $1', [userId]),
      db.query('SELECT COUNT(*) as count FROM signal_moi.campagnes WHERE created_by = $1', [userId]),
      db.query('SELECT COUNT(*) as count FROM signal_moi.notifications WHERE user_id = $1 AND is_read = false', [userId])
    ]);

    const dashboard = {
      collaborator: req.user,
      stats: {
        totalSignalements: parseInt(signalementCount.rows[0].count),
        totalCampaigns: parseInt(campaignCount.rows[0].count),
        pendingNotifications: parseInt(notificationCount.rows[0].count)
      },
      recentActivity: {
        notifications: [],
        signalements: [],
        campaigns: []
      }
    };

    console.log(`[COLLABORATOR GET /dashboard] Collaborateur ${userId}`);
    res.json(dashboard);
  } catch (err) {
    console.error('[COLLABORATOR GET /dashboard] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// GET /api/collaborator/notifications - Notifications + Messages + Rappels
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(`
      SELECT 
        'new_case' as type, 
        id as notification_id,
        'Nouveau cas signalé' as title,
        'Un signalement a été enregistré' as message,
        created_at,
        false as is_read
      FROM signal_moi.signalements
      WHERE created_at > NOW() - INTERVAL '7 days'
      LIMIT 20
    `);

    const notifications = result.rows.map(n => ({
      id: n.notification_id,
      type: n.type,
      title: n.title,
      message: n.message,
      timestamp: n.created_at,
      isRead: n.is_read
    }));

    console.log(`[COLLABORATOR GET /notifications] ${notifications.length} notifications`);
    res.json(notifications);
  } catch (err) {
    console.error('[COLLABORATOR GET /notifications] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// GET /api/collaborator/signalements - Signalements assignés
router.get('/signalements', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        s.id, s.titre, s.description, s.type, s.statut, 
        s.localisation, s.latitude, s.longitude, 
        s.created_at, u.prenom, u.nom, u.email
      FROM signal_moi.signalements s
      LEFT JOIN signal_moi.users u ON u.id = s.user_id
      WHERE s.statut != 'fermé'
      ORDER BY s.created_at DESC
      LIMIT 50
    `);

    const signalements = result.rows.map(s => ({
      id: s.id,
      titre: s.titre,
      description: s.description,
      type: s.type,
      statut: s.statut,
      localisation: s.localisation,
      coordinates: { lat: s.latitude, lng: s.longitude },
      createdAt: s.created_at,
      author: { prenom: s.prenom, nom: s.nom, email: s.email }
    }));

    console.log(`[COLLABORATOR GET /signalements] ${signalements.length} signalements`);
    res.json(signalements);
  } catch (err) {
    console.error('[COLLABORATOR GET /signalements] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// GET /api/collaborator/campaigns - Campagnes
router.get('/campaigns', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(`
      SELECT 
        id, titre, description, type, date_debut, date_fin,
        lieu, est_actif, created_at
      FROM signal_moi.campagnes
      WHERE created_by = $1
      ORDER BY date_debut DESC
    `, [userId]);

    const campaigns = result.rows.map(c => ({
      id: c.id,
      titre: c.titre,
      description: c.description,
      type: c.type, // Atéliers, publications, Actions terrain
      dateDebut: c.date_debut,
      dateFin: c.date_fin,
      lieu: c.lieu,
      estActif: c.est_actif,
      createdAt: c.created_at
    }));

    console.log(`[COLLABORATOR GET /campaigns] ${campaigns.length} campagnes`);
    res.json(campaigns);
  } catch (err) {
    console.error('[COLLABORATOR GET /campaigns] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// POST /api/collaborator/campaigns - Créer une campagne
router.post('/campaigns', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { titre, description, type, dateDebut, dateFin, lieu, capaciteMax } = req.body;

    if (!titre || !type) {
      return res.status(400).json({ error: 'Titre et type sont requis' });
    }

    const result = await db.query(`
      INSERT INTO signal_moi.campagnes 
      (titre, description, type, date_debut, date_fin, lieu, capacite_max, created_by, est_actif)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, titre, type
    `, [titre, description, type, dateDebut, dateFin, lieu, capaciteMax, userId, true]);

    const campaign = result.rows[0];
    console.log(`[COLLABORATOR POST /campaigns] Campagne créée: ${campaign.id}`);
    res.status(201).json(campaign);
  } catch (err) {
    console.error('[COLLABORATOR POST /campaigns] Erreur:', err);
    res.status(500).json({ error: 'Erreur lors de la création', details: err.message });
  }
});

// GET /api/collaborator/statistics - Statistiques
router.get('/statistics', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(DISTINCT s.id) as total_signalements,
        COUNT(DISTINCT CASE WHEN s.statut = 'nouveau' THEN s.id END) as signalements_nouveaux,
        COUNT(DISTINCT CASE WHEN s.statut = 'en_cours' THEN s.id END) as signalements_en_cours,
        COUNT(DISTINCT CASE WHEN s.type = 'violence' THEN s.id END) as violence_cases
      FROM signal_moi.signalements s
    `);

    const stats = {
      totalSignalements: result.rows[0].total_signalements,
      newCases: result.rows[0].signalements_nouveaux,
      inProgressCases: result.rows[0].signalements_en_cours,
      violenceCases: result.rows[0].violence_cases
    };

    console.log(`[COLLABORATOR GET /statistics] Stats retournées`);
    res.json(stats);
  } catch (err) {
    console.error('[COLLABORATOR GET /statistics] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// POST /api/collaborator/follow - suivre un signalement
router.post('/follow', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { caseId } = req.body;
    if (!caseId) return res.status(400).json({ error: 'caseId requis' });
    await FollowedCase.add(userId, caseId);
    res.json({ success: true });
  } catch (err) {
    console.error('[COLLABORATOR POST /follow] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// DELETE /api/collaborator/follow/:caseId - ne plus suivre
router.delete('/follow/:caseId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { caseId } = req.params;
    await FollowedCase.remove(userId, caseId);
    res.json({ success: true });
  } catch (err) {
    console.error('[COLLABORATOR DELETE /follow/:caseId] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// GET /api/collaborator/followed - lister les dossiers suivis par le collaborateur
router.get('/followed', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await FollowedCase.listByUser(userId);
    res.json(rows);
  } catch (err) {
    console.error('[COLLABORATOR GET /followed] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// GET /api/collaborator/export/cases?format=pdf|excel - exporter dossiers suivis
router.get('/export/cases', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const format = (req.query.format || 'pdf').toLowerCase();
    const cases = await FollowedCase.listByUser(userId);

    if (format === 'excel' || format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Dossiers suivis');
      sheet.columns = [
        { header: 'ID', key: 'id', width: 36 },
        { header: 'Titre', key: 'titre', width: 40 },
        { header: 'Statut', key: 'statut', width: 20 },
        { header: 'Créé le', key: 'created_at', width: 24 }
      ];
      cases.forEach(c => sheet.addRow({ id: c.id, titre: c.titre, statut: c.statut, created_at: c.created_at }));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="dossiers_suivis.xlsx"');
      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    // Default PDF
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="dossiers_suivis.pdf"');
    doc.pipe(res);
    doc.fontSize(18).text('Dossiers suivis', { align: 'center' });
    doc.moveDown();
    cases.forEach((c, idx) => {
      doc.fontSize(12).text(`${idx + 1}. ${c.titre} (${c.id})`);
      doc.fontSize(10).text(`Statut: ${c.statut || 'N/A'}  •  Créé: ${c.created_at}`);
      doc.moveDown();
    });
    doc.end();
  } catch (err) {
    console.error('[COLLABORATOR GET /export/cases] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

module.exports = router;
