// backend/src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SiteConfig = require('../models/SiteConfig');
const { sendEmail } = require('../services/email.service');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Configuration multer pour le logo
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', '..', 'uploads', 'logos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `logo-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const logoFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Accepte: JPEG, PNG, WebP, GIF'), false);
  }
};

const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: logoFilter,
  limits: {
    fileSize: 5242880 // 5MB
  }
});

const slideshowStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', '..', 'uploads', 'slideshow');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `slideshow-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const slideshowFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Accepte: JPEG, PNG, WebP, GIF'), false);
  }
};

const uploadSlideshowImages = multer({
  storage: slideshowStorage,
  fileFilter: slideshowFilter,
  limits: {
    fileSize: 5242880 // 5MB
  }
});

// ? Middleware d'authentification admin
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token d\'authentification manquant' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
        
        // Vérifier le rôle depuis le token OU depuis la base de données
        if (decoded.role === 'admin') {
            req.user = decoded;
            return next();
        }
        
        // Fallback: vérifier dans la base de données
        const userResult = await db.query(
            'SELECT id, role FROM signal_moi.users WHERE id = $1',
            [decoded.id]
        );
        const user = (userResult.rows || [])[0];
        if (user && user.role === 'admin') {
            req.user = { id: decoded.id, role: 'admin' };
            return next();
        }
        
        return res.status(403).json({ error: 'Accès administrateur requis' });
    } catch (err) {
        return res.status(401).json({ error: 'Token invalide', details: err.message });
    }
};

// --- Routes de test (à conserver pour le débogage) ---
router.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as now');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Gestion des utilisateurs ---
// GET /api/admin/users - Récupére la liste de tous les utilisateurs actifs (protégé)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT id, prenom, nom, email, telephone, ville, quartier, role, is_active FROM signal_moi.users WHERE is_active = true ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('[ADMIN GET /users] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// POST /api/admin/users - Crée un nouvel utilisateur (protégé)
router.post('/users', authMiddleware, async (req, res) => {
  console.log('[ADMIN POST /users] Body reçu:', req.body);
  const { prenom, nom, email, telephone, password, ville, quartier, role } = req.body;

  // Validation basique des champs obligatoires
  if (!prenom || !nom || !email || !telephone || !password || !ville || !quartier) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  try {
    const hashed = await require('bcrypt').hash(password, 10);
    const insertQuery = `
      INSERT INTO signal_moi.users (prenom, nom, email, telephone, password, ville, quartier, role, is_active, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, prenom, nom, email, role
    `;
    const values = [prenom, nom, email, telephone, hashed, ville, quartier, role || 'citoyen', true, true];
    const result = await db.query(insertQuery, values);
    console.log('[ADMIN POST /users] Utilisateur créé:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[ADMIN POST /users] Erreur SQL:', err);
    res.status(500).json({ error: 'Erreur lors de la création', details: err.message });
  }
});

// PUT /api/admin/users/:id - Met � jour un utilisateur
router.put('/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { prenom, nom, email, telephone, ville, quartier, role, is_active } = req.body;
  try {
    // Construire dynamiquement la clause SET
    const fields = [];
    const values = [];
    if (prenom !== undefined) { fields.push(`prenom = $${fields.length + 1}`); values.push(prenom) }
    if (nom !== undefined) { fields.push(`nom = $${fields.length + 1}`); values.push(nom) }
    if (email !== undefined) { fields.push(`email = $${fields.length + 1}`); values.push(email) }
    if (telephone !== undefined) { fields.push(`telephone = $${fields.length + 1}`); values.push(telephone) }
    if (ville !== undefined) { fields.push(`ville = $${fields.length + 1}`); values.push(ville) }
    if (quartier !== undefined) { fields.push(`quartier = $${fields.length + 1}`); values.push(quartier) }
    if (role !== undefined) { fields.push(`role = $${fields.length + 1}`); values.push(role) }
    if (is_active !== undefined) { fields.push(`is_active = $${fields.length + 1}`); values.push(is_active) }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Aucun champ � mettre � jour' });
    }

    const query = `UPDATE signal_moi.users SET ${fields.join(', ')} WHERE id = $${fields.length + 1} RETURNING id, prenom, nom, email, telephone, ville, quartier, role, is_active`;
    values.push(id);
    const result = await db.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[ADMIN PUT /users/:id] Erreur:', err);
    res.status(500).json({ error: 'Erreur lors de la mise � jour', details: err.message });
  }
});

// DELETE /api/admin/users/:id - Supprime (ou d�sactive) un utilisateur
router.delete('/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    // Ici on choisit de d�sactiver plut�t que supprimer physiquement
    const result = await db.query('UPDATE signal_moi.users SET is_active = false WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ success: true });
  } catch (err) {
    console.error('[ADMIN DELETE /users/:id] Erreur:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression', details: err.message });
  }
});

// POST /api/admin/users/:id/reset-password - R�initialise le mot de passe d'un utilisateur
router.post('/users/:id/reset-password', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const defaultPassword = process.env.DEFAULT_RESET_PASSWORD || 'Default123!';
    const hashed = await bcrypt.hash(defaultPassword, 10);
    const result = await db.query('UPDATE signal_moi.users SET password = $1 WHERE id = $2 RETURNING id', [hashed, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ success: true });
  } catch (err) {
    console.error('[ADMIN POST /users/:id/reset-password] Erreur:', err);
    res.status(500).json({ error: 'Erreur lors de la r�initialisation', details: err.message });
  }
});

// PATCH /api/admin/users/:id/role - Change le r�le d'un utilisateur
router.patch('/users/:id/role', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Role requis' });
  try {
    const result = await db.query('UPDATE signal_moi.users SET role = $1 WHERE id = $2 RETURNING id, role', [role, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[ADMIN PATCH /users/:id/role] Erreur:', err);
    res.status(500).json({ error: 'Erreur lors du changement de r�le', details: err.message });
  }
});
// PUT /api/admin/users/:id - Modifier les infos d'un utilisateur (admin)
router.put('/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { prenom, nom, email, telephone, ville, quartier, role, is_active } = req.body;
  try {
    // Construire dynamiquement la clause SET
    const fields = [];
    const values = [];
    if (prenom !== undefined) { fields.push(`prenom = $${fields.length + 1}`); values.push(prenom) }
    if (nom !== undefined) { fields.push(`nom = $${fields.length + 1}`); values.push(nom) }
    if (email !== undefined) { fields.push(`email = $${fields.length + 1}`); values.push(email) }
    if (telephone !== undefined) { fields.push(`telephone = $${fields.length + 1}`); values.push(telephone) }
    if (ville !== undefined) { fields.push(`ville = $${fields.length + 1}`); values.push(ville) }
    if (quartier !== undefined) { fields.push(`quartier = $${fields.length + 1}`); values.push(quartier) }
    if (role !== undefined) { fields.push(`role = $${fields.length + 1}`); values.push(role) }
    if (is_active !== undefined) { fields.push(`is_active = $${fields.length + 1}`); values.push(is_active) }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    const query = `UPDATE signal_moi.users SET ${fields.join(', ')} WHERE id = $${fields.length + 1} RETURNING id, prenom, nom, email, telephone, ville, quartier, role, is_active`;
    values.push(id);
    const result = await db.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[ADMIN PUT /users/:id] Erreur:', err);
    res.status(500).json({ error: 'Erreur lors de la modification', details: err.message });
  }
});

// DELETE /api/admin/users/:id - Supprimer (désactiver) un utilisateur
router.delete('/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    // Vérifier que l'admin ne supprime pas le seul admin
    const adminCheck = await db.query('SELECT COUNT(*) as count FROM signal_moi.users WHERE role = $1 AND is_active = true', ['admin']);
    const activeAdmins = parseInt(adminCheck.rows[0].count || '0');
    
    const userCheck = await db.query('SELECT role FROM signal_moi.users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const isAdmin = userCheck.rows[0].role === 'admin';
    
    if (isAdmin && activeAdmins <= 1) {
      return res.status(400).json({ error: 'Impossible de supprimer le dernier administrateur' });
    }

    // Désactiver plutôt que supprimer physiquement
    const result = await db.query('UPDATE signal_moi.users SET is_active = false WHERE id = $1 RETURNING id', [id]);
    res.json({ success: true, message: 'Utilisateur désactivé avec succès' });
  } catch (err) {
    console.error('[ADMIN DELETE /users/:id] Erreur:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression', details: err.message });
  }
});

// Ajoutez cette route apr�s les autres routes GET (par exemple apr�s `/users`)
router.get('/signalements', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`SELECT s.*, u.prenom AS user_prenom, u.nom AS user_nom, u.telephone AS user_telephone, u.email AS user_email
                                   FROM signal_moi.signalements s
                                   LEFT JOIN signal_moi.users u ON u.id = s.user_id
                                   ORDER BY s.created_at DESC LIMIT 200`);
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
        telephone: r.user_telephone,
        email: r.user_email
      }
    }));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/site-config', authMiddleware, async (req, res) => {
  try {
    const config = await SiteConfig.getAll();
    res.json(config);
  } catch (err) {
    console.error('[ADMIN GET /site-config] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// GET /api/admin/campagnes - Récupère toutes les campagnes
router.get('/campagnes', authMiddleware, async (req, res) => {
  try {
    // Récupérer les campagnes avec colonnes explicites (éviter SELECT *)
    const result = await db.query(`
      SELECT 
        c.id, c.titre, c.description, c.type, c.date_debut, c.date_fin, 
        c.lieu, c.capacite_max, c.est_actif, c.image_url, c.created_at, c.updated_at,
        u.id AS creator_id, u.prenom, u.nom, u.email, u.role AS creator_role
      FROM signal_moi.campagnes c
      LEFT JOIN signal_moi.users u ON u.id = c.created_by
      ORDER BY c.date_debut DESC
    `);
    
    // Mapper les résultats
    const campagnes = (result.rows || []).map(c => ({
      id: c.id,
      titre: c.titre,
      description: c.description,
      type: c.type,
      date_debut: c.date_debut,
      date_fin: c.date_fin,
      lieu: c.lieu,
      capacite_max: c.capacite_max,
      est_actif: c.est_actif,
      image_url: c.image_url,
      image: c.image_url,
      created_at: c.created_at,
      updated_at: c.updated_at,
      creator: {
        id: c.creator_id,
        prenom: c.prenom,
        nom: c.nom,
        email: c.email,
        role: c.creator_role
      }
    }));
    
    console.log(`[ADMIN GET /campagnes] Retournant ${campagnes.length} campagnes`);
    res.json(campagnes);
  } catch (err) {
    console.error('[ADMIN GET /campagnes] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

router.post('/site-config', authMiddleware, async (req, res) => {
  try {
    const { siteName, contactEmail, contactPhone, address, logoUrl, contactPage, aboutPage, homePage, socialLinks, emergencyPolice, emergencyFire } = req.body;

    if (!siteName || !contactEmail || !contactPhone || !address) {
      return res.status(400).json({ error: 'Les champs de base (siteName, contactEmail, contactPhone, address) sont requis' });
    }

    const tasks = [
      SiteConfig.set('siteName', siteName),
      SiteConfig.set('contactEmail', contactEmail),
      SiteConfig.set('contactPhone', contactPhone),
      SiteConfig.set('address', address)
    ];

    if (logoUrl !== undefined) tasks.push(SiteConfig.set('logoUrl', logoUrl));
    if (emergencyPolice !== undefined) tasks.push(SiteConfig.set('emergency_police', emergencyPolice));
    if (emergencyFire !== undefined) tasks.push(SiteConfig.set('emergency_fire', emergencyFire));

    if (contactPage !== undefined) tasks.push(SiteConfig.set('contact_page', JSON.stringify(contactPage)));
    if (aboutPage !== undefined) tasks.push(SiteConfig.set('about_page', JSON.stringify(aboutPage)));
    if (homePage !== undefined) tasks.push(SiteConfig.set('home_page', JSON.stringify(homePage)));
    // Supporter un objet de liens sociaux (facebook, twitter, instagram, whatsapp, etc.)
    if (socialLinks !== undefined) {
      try {
        tasks.push(SiteConfig.set('social_links', JSON.stringify(socialLinks)));
      } catch (e) {
        console.warn('[ADMIN POST /site-config] socialLinks non JSONifiable', e);
      }
    }

    await Promise.all(tasks);
    res.json({ success: true });
  } catch (err) {
    console.error('[ADMIN POST /site-config] Erreur:', err);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde', details: err.message });
  }
});

// PUT /api/admin/site-config/slideshow-images - Téléversement des images du diaporama de la page d'accueil
router.put('/site-config/slideshow-images', authMiddleware, uploadSlideshowImages.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier n\'a été téléchargé' });
    }

    const currentConfig = await SiteConfig.getAll();
    const homePage = typeof currentConfig.home_page === 'string' ? JSON.parse(currentConfig.home_page) : (currentConfig.home_page || {});
    const existingImages = Array.isArray(homePage.images) ? homePage.images.filter(Boolean) : [];

    const uploadedImages = req.files.map((file) => {
      const buffer = fs.readFileSync(file.path);
      return `data:${file.mimetype || 'image/png'};base64,${buffer.toString('base64')}`;
    });

    const nextImages = [...existingImages, ...uploadedImages];
    homePage.images = nextImages;

    await SiteConfig.set('home_page', JSON.stringify(homePage));

    req.files.forEach((file) => {
      try {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      } catch (e) {
        console.warn('⚠️  Impossible de supprimer l\'image temporaire:', e.message);
      }
    });

    res.json({ success: true, message: 'Images du diaporama enregistrées', images: nextImages });
  } catch (err) {
    console.error('[ADMIN PUT /site-config/slideshow-images] Erreur:', err);
    req.files?.forEach((file) => {
      try {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      } catch (e) {
        console.warn('⚠️  Impossible de nettoyer l\'image temporaire:', e.message);
      }
    });
    res.status(500).json({ error: 'Erreur lors de l\'upload des images du diaporama', details: err.message });
  }
});

// PUT /api/admin/site-config/logo - Upload et changement du logo (stocké en BD pour éviter perte au redéploiement)
router.put('/site-config/logo', authMiddleware, uploadLogo.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier n\'a été téléchargé' });
    }

    // Lire le fichier en tant que buffer
    const logoBuffer = fs.readFileSync(req.file.path);
    const filename = req.file.filename;

    // Sauvegarder le logo en tant que données binaires dans la base de données
    await SiteConfig.setLogoBinary(logoBuffer, filename);

    // Supprimer le fichier local après sauvegarde en BD
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (e) {
      console.warn('⚠️  Impossible de supprimer le fichier local:', e.message);
    }

    res.json({
      success: true,
      message: 'Logo changé avec succès',
      logoUrl: '/uploads/logo' // URL virtuelle pour récupérer depuis BD
    });
  } catch (err) {
    console.error('[ADMIN PUT /site-config/logo] Erreur:', err);
    // Supprimer le fichier uploadé en cas d'erreur
    try {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (e) {
      console.warn('⚠️  Impossible de nettoyer le fichier temporaire:', e.message);
    }
    res.status(500).json({ error: 'Erreur lors du changement du logo', details: err.message });
  }
});

// DELETE /api/admin/signalements/:id - Supprimer un signalement et notifier l'auteur
router.delete('/signalements/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body; // Raison de la suppression
  
  try {
    // Récupérer les infos du signalement et de l'auteur
    const signalementsResult = await db.query(
      `SELECT s.id, s.titre, u.email, u.prenom, u.nom 
       FROM signal_moi.signalements s
       LEFT JOIN signal_moi.users u ON u.id = s.user_id
       WHERE s.id = $1`,
      [id]
    );
    
    if (signalementsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Signalement introuvable' });
    }
    
    const signalement = signalementsResult.rows[0];
    
    // Supprimer le signalement
    await db.query('DELETE FROM signal_moi.signalements WHERE id = $1', [id]);
    
    // Envoyer une notification à l'auteur si email existe
    if (signalement.email) {
      try {
        await sendEmail({
          to: signalement.email,
          subject: '⚠️ Votre signalement a été supprimé',
          template: 'signalement-deleted',
          data: {
            name: `${signalement.prenom} ${signalement.nom}`,
            titre: signalement.titre,
            reason: reason || 'Non spécifiée',
            contactEmail: process.env.CONTACT_EMAIL || 'admin@signal-moi.com'
          }
        });
      } catch (emailErr) {
        console.error('[DELETE /signalements/:id] Erreur notification email:', emailErr);
        // Ne pas bloquer la suppression si l'email échoue
      }
    }
    
    res.json({ success: true, message: 'Signalement supprimé et notification envoyée' });
  } catch (err) {
    console.error('[ADMIN DELETE /signalements/:id] Erreur:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression', details: err.message });
  }
});

// DELETE /api/admin/campagnes/:id - Supprimer une campagne et notifier les inscrits
router.delete('/campagnes/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body; // Raison de la suppression
  
  try {
    // Récupérer la campagne
    const campaigneResult = await db.query(
      'SELECT id, titre FROM signal_moi.campagnes WHERE id = $1',
      [id]
    );
    
    if (campaigneResult.rows.length === 0) {
      return res.status(404).json({ error: 'Campagne introuvable' });
    }
    
    const campagne = campaigneResult.rows[0];
    
    // Récupérer les emails des utilisateurs inscrits
    const inscritResult = await db.query(
      `SELECT DISTINCT u.email, u.prenom, u.nom
       FROM signal_moi.inscriptions_campagnes ic
       JOIN signal_moi.users u ON u.id = ic.user_id
       WHERE ic.campagne_id = $1`,
      [id]
    );
    
    const inscrits = inscritResult.rows || [];
    
    // Supprimer la campagne (supprimera aussi les inscriptions via CASCADE)
    await db.query('DELETE FROM signal_moi.campagnes WHERE id = $1', [id]);
    
    // Envoyer une notification à tous les inscrits
    const notificationPromises = inscrits.map(inscrit => 
      sendEmail({
        to: inscrit.email,
        subject: '⚠️ Une campagne a été supprimée',
        template: 'campagne-deleted',
        data: {
          name: `${inscrit.prenom} ${inscrit.nom}`,
          titre: campagne.titre,
          reason: reason || 'Non spécifiée',
          contactEmail: process.env.CONTACT_EMAIL || 'admin@signal-moi.com'
        }
      }).catch(err => {
        console.error(`[DELETE /campagnes/:id] Erreur notification email pour ${inscrit.email}:`, err);
        // Ne pas bloquer si une notification échoue
      })
    );
    
    await Promise.all(notificationPromises);
    
    res.json({ 
      success: true, 
      message: `Campagne supprimée et ${inscrits.length} notification(s) envoyée(s)` 
    });
  } catch (err) {
    console.error('[ADMIN DELETE /campagnes/:id] Erreur:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression', details: err.message });
  }
});

module.exports = router;



