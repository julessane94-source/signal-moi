const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { protect } = require('../middleware/auth.middleware');

// Dashboard du citoyen - GET /api/citizen/dashboard
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Récupérer les infos de l'utilisateur
    const userResult = await db.query(
      'SELECT id, prenom, nom, email, telephone, ville, quartier, role, is_active, avatar FROM signal_moi.users WHERE id = $1',
      [req.user.id]
    );
    const user = (userResult.rows || [])[0];
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Récupérer les signalements du citoyen
    const signalementsResult = await db.query(
      `SELECT id, titre, description, type, statut, priorite, localisation, 
              date_signalement, views_count, upvotes 
       FROM signal_moi.signalements 
       WHERE user_id = $1 
       ORDER BY date_signalement DESC 
       LIMIT 10`,
      [req.user.id]
    );
    const signalements = signalementsResult.rows || [];

    // Récupérer les campagnes actives
    const campaignsResult = await db.query(
      `SELECT id, titre, description, type, date_debut, date_fin, lieu, capacite_max, image_url
       FROM signal_moi.campagnes 
       WHERE est_actif = true AND date_fin > NOW()
       ORDER BY date_debut ASC 
       LIMIT 5`
    );
    const campaigns = campaignsResult.rows || [];

    // Récupérer les inscriptions du citoyen aux campagnes
    const inscriptionsResult = await db.query(
      `SELECT ic.id, ic.campagne_id, ic.date_inscription, c.titre, c.date_debut, c.lieu
       FROM signal_moi.inscriptions_campagnes ic
       JOIN signal_moi.campagnes c ON ic.campagne_id = c.id
       WHERE ic.user_id = $1
       ORDER BY c.date_debut ASC`,
      [req.user.id]
    );
    const inscriptions = inscriptionsResult.rows || [];

    res.json({
      success: true,
      dashboard: {
        user: {
          id: user.id,
          prenom: user.prenom,
          nom: user.nom,
          email: user.email,
          telephone: user.telephone,
          ville: user.ville,
          quartier: user.quartier,
          avatar: user.avatar,
          role: user.role
        },
        stats: {
          totalSignalements: signalements.length,
          totalInscriptions: inscriptions.length,
          totalVues: signalements.reduce((sum, s) => sum + (s.views_count || 0), 0),
          totalUpvotes: signalements.reduce((sum, s) => sum + (s.upvotes || 0), 0)
        },
        signalements: signalements,
        campaigns: campaigns,
        inscriptions: inscriptions
      }
    });
  } catch (error) {
    console.error('[CITIZEN DASHBOARD] Erreur:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/citizen/signalements - Tous les signalements du citoyen
router.get('/signalements', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, titre, description, type, statut, priorite, localisation, 
              date_signalement, date_resolution, views_count, upvotes 
       FROM signal_moi.signalements 
       WHERE user_id = $1 
       ORDER BY date_signalement DESC`,
      [req.user.id]
    );
    res.json({
      success: true,
      signalements: result.rows || []
    });
  } catch (error) {
    console.error('[CITIZEN SIGNALEMENTS] Erreur:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/citizen/inscriptions - Inscriptions aux campagnes
router.get('/inscriptions', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ic.id, ic.campagne_id, ic.date_inscription, c.titre, c.description, 
              c.type, c.date_debut, c.date_fin, c.lieu, c.image_url
       FROM signal_moi.inscriptions_campagnes ic
       JOIN signal_moi.campagnes c ON ic.campagne_id = c.id
       WHERE ic.user_id = $1
       ORDER BY c.date_debut ASC`,
      [req.user.id]
    );
    res.json({
      success: true,
      inscriptions: result.rows || []
    });
  } catch (error) {
    console.error('[CITIZEN INSCRIPTIONS] Erreur:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/citizen/notifications/count - Nombre de notifications non lues
router.get('/notifications/count', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*)::int as unread_count 
       FROM signal_moi.notifications 
       WHERE user_id = $1 AND est_lu = false`,
      [req.user.id]
    );
    const unreadCount = result.rows[0]?.unread_count || 0;
    res.json({
      success: true,
      unreadCount: unreadCount
    });
  } catch (error) {
    console.error('[CITIZEN NOTIFICATIONS COUNT] Erreur:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/citizen/notifications - Toutes les notifications
router.get('/notifications', protect, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, type, titre, message, reference_id, est_lu, created_at
       FROM signal_moi.notifications 
       WHERE user_id = $1
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );
    res.json({
      success: true,
      notifications: result.rows || []
    });
  } catch (error) {
    console.error('[CITIZEN NOTIFICATIONS] Erreur:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
