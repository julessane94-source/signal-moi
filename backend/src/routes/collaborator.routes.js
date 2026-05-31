// backend/src/routes/collaborator.routes.js
// Dashboard pour les collaborateurs (ONG, Association)

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const FollowedCase = require('../models/FollowedCase');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Configuration multer pour les images de campagne
const uploadDir = path.resolve(__dirname, '..', '..', 'uploads', 'campagnes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

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
const allowedCampaignTypes = ['formation', 'activite', 'sensibilisation', 'marche', 'conference', 'autre'];

router.post('/campaigns', authMiddleware, upload.single('image'), async (req, res) => {
  const userId = req.user.id;
  const { titre, description, type, dateDebut, dateFin, lieu, capaciteMax } = req.body;

  // Validation des champs obligatoires
  if (!titre || !type || !dateDebut || !dateFin || !lieu) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ error: 'Titre, type, dates et lieu sont requis' });
  }

  if (!allowedCampaignTypes.includes(type)) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ error: 'Type de campagne invalide' });
  }

  const startDate = new Date(dateDebut);
  const endDate = new Date(dateFin);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ error: 'Dates invalides ou incohérentes' });
  }

  try {
    await db.query('BEGIN');

    // Construire l'URL de l'image
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/campagnes/${req.file.filename}`;
    }

    const result = await db.query(`
      INSERT INTO signal_moi.campagnes 
      (titre, description, type, date_debut, date_fin, lieu, capacite_max, created_by, est_actif, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, titre, type, image_url, created_at
    `, [titre, description || '', type, dateDebut, dateFin, lieu || '', capaciteMax || 100, userId, true, imageUrl]);

    const campaign = result.rows[0];

    if (req.file) {
      const fileId = uuidv4();
      const chemin = `uploads/campagnes/${req.file.filename}`.replace(/\\/g, '/');
      const fileData = await fs.promises.readFile(req.file.path);
      await db.query(
        `INSERT INTO signal_moi.fichiers (id, nom_fichier, chemin, type, taille, mime_type, description, is_verified, uploaded_by, file_data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [fileId, req.file.originalname, chemin, 'image', req.file.size || 0, req.file.mimetype, null, false, userId, fileData]
      );
    }

    await db.query('COMMIT');
    console.log(`[COLLABORATOR POST /campaigns] Campagne créée: ${campaign.id}`);
    res.status(201).json(campaign);
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('[COLLABORATOR POST /campaigns] Erreur suppression fichier:', unlinkErr);
      }
    }
    console.error('[COLLABORATOR POST /campaigns] Erreur:', err);
    res.status(500).json({ error: 'Erreur lors de la création de campagne', details: err.message });
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
    console.log(`[EXPORT] Début export format=${format} userId=${userId}`);
    
    // Vérifier que les dépendances existent
    if (!ExcelJS) {
      console.error('[EXPORT] ❌ ExcelJS non chargé');
      return res.status(500).json({ error: 'ExcelJS non disponible' });
    }
    if (!PDFDocument) {
      console.error('[EXPORT] ❌ PDFDocument non chargé');
      return res.status(500).json({ error: 'PDFDocument non disponible' });
    }

    // Récupérer les dossiers suivis
    const cases = await FollowedCase.listByUser(userId);
    console.log(`[EXPORT] ${cases.length} dossiers trouvés pour l'utilisateur`);

    // Export Excel
    if (format === 'excel' || format === 'xlsx') {
      try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Dossiers suivis');
        sheet.columns = [
          { header: 'ID', key: 'id', width: 36 },
          { header: 'Titre', key: 'titre', width: 40 },
          { header: 'Statut', key: 'statut', width: 20 },
          { header: 'Créé le', key: 'created_at', width: 24 }
        ];
        
        // Ajouter les données
        cases.forEach(c => {
          sheet.addRow({
            id: c.id || 'N/A',
            titre: c.titre || 'Sans titre',
            statut: c.statut || 'N/A',
            created_at: c.created_at || new Date().toISOString()
          });
        });

        // Configurer les headers de réponse
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="dossiers_suivis.xlsx"');
        
        // Écrire le fichier
        await workbook.xlsx.write(res);
        console.log(`[EXPORT] ✅ Export Excel réussi`);
        return;
      } catch (excelErr) {
        console.error('[EXPORT] ❌ Erreur Excel:', excelErr.message);
        return res.status(500).json({ error: 'Erreur lors de l\'export Excel', details: excelErr.message });
      }
    }

    // Export PDF (par défaut)
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      
      // Configurer les headers de réponse
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="dossiers_suivis.pdf"');
      
      // Pipe le document vers la réponse
      doc.pipe(res);
      
      // Ajouter le contenu
      doc.fontSize(18).text('Dossiers suivis', { align: 'center' });
      doc.moveDown();
      
      if (cases.length === 0) {
        doc.fontSize(12).text('Aucun dossier suivi');
      } else {
        cases.forEach((c, idx) => {
          doc.fontSize(12).text(`${idx + 1}. ${c.titre || 'Sans titre'} (${c.id})`);
          doc.fontSize(10).text(`Statut: ${c.statut || 'N/A'}  •  Créé: ${c.created_at || 'N/A'}`);
          doc.moveDown();
        });
      }
      
      // Finaliser le document
      doc.on('finish', () => {
        console.log(`[EXPORT] ✅ Export PDF réussi`);
      });
      doc.on('error', (err) => {
        console.error('[EXPORT] ❌ Erreur PDF:', err.message);
      });
      doc.end();
    } catch (pdfErr) {
      console.error('[EXPORT] ❌ Erreur PDF:', pdfErr.message);
      return res.status(500).json({ error: 'Erreur lors de l\'export PDF', details: pdfErr.message });
    }
  } catch (err) {
    console.error('[EXPORT] ❌ Erreur générale:', err.message);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

module.exports = router;
