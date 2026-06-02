const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/database');
const { protect } = require('../middleware/auth.middleware');
const SiteConfig = require('../models/SiteConfig');

// GET /api/auth/site-config - Récupère la configuration du site (PUBLIC - sans auth)
router.get('/site-config', async (req, res) => {
  try {
    const config = await SiteConfig.getAll();
    // Coerce certains champs pour éviter les erreurs côté client
    const safeConfig = {
      ...config,
      logoUrl: config.logoUrl || config.logo_url || '/icons/icon-192x192.png',
      contactEmail: config.contactEmail != null ? String(config.contactEmail) : '',
      contactPhone: config.contactPhone != null ? String(config.contactPhone) : '',
      address: config.address != null ? String(config.address) : '',
      socialLinks: typeof config.socialLinks === 'object' && config.socialLinks !== null
        ? {
            facebook: config.socialLinks.facebook != null ? String(config.socialLinks.facebook) : '',
            twitter: config.socialLinks.twitter != null ? String(config.socialLinks.twitter) : '',
            instagram: config.socialLinks.instagram != null ? String(config.socialLinks.instagram) : '',
            whatsapp: config.socialLinks.whatsapp != null ? String(config.socialLinks.whatsapp) : ''
          }
        : {}
    };
    // Récupérer quelques campagnes des collaborateurs à afficher sur l'accueil
    try {
      const campagnesRes = await db.query(`
        SELECT c.id, c.titre, c.description, c.type, c.date_debut, c.date_fin, c.lieu, c.image_url,
               u.id AS creator_id, u.prenom, u.nom, u.role
        FROM signal_moi.campagnes c
        LEFT JOIN signal_moi.users u ON u.id = c.created_by
        WHERE c.est_actif = true AND u.role = 'collaborateur'
        ORDER BY c.date_debut DESC
        LIMIT 6
      `);
      const collaboratorCampaigns = (campagnesRes.rows || []).map(c => ({
        id: c.id,
        titre: c.titre,
        description: c.description,
        type: c.type,
        date_debut: c.date_debut,
        date_fin: c.date_fin,
        lieu: c.lieu,
        image_url: c.image_url,
        creator: { id: c.creator_id, prenom: c.prenom, nom: c.nom, role: c.role }
      }));
      res.json({ ...safeConfig, collaboratorCampaigns });
    } catch (err) {
      console.error('[GET /site-config] Erreur campagnes:', err);
      res.json(config);
    }
  } catch (err) {
    console.error('[GET /site-config] Erreur:', err);
    // Retourner une configuration par défaut pour le dev local au lieu d'une 500
    const defaultConfig = {
      siteName: 'Signal-Moi (local)',
      logoUrl: '/icons/icon-192x192.png',
      theme: 'default',
      collaboratorCampaigns: []
    };
    res.json(defaultConfig);
  }
});

// Inscription
router.post('/register', async (req, res) => {
  try {
    // Support des formats: camelCase, snake_case, et français
    const prenom = req.body.firstName || req.body.first_name || req.body.prenom;
    const nom = req.body.lastName || req.body.last_name || req.body.nom;
    const email = req.body.email;
    const password = req.body.password;
    const telephone = req.body.phone || req.body.telephone;
    const ville = req.body.city || req.body.ville;
    const quartier = req.body.quartier || req.body.district || 'Inconnu';
    const dataNaissance = req.body.dateNaissance || req.body.date_naissance || req.body.dob || '2000-01-01';
    const lieuNaissance = req.body.lieuNaissance || req.body.lieu_naissance || ville || 'Inconnu';

    // Validation des champs obligatoires
    if (!prenom || !nom || !email || !password || !telephone || !ville) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tous les champs sont obligatoires',
        required: ['prenom', 'nom', 'email', 'password', 'telephone', 'ville'],
        received: {
          prenom: !!prenom,
          nom: !!nom,
          email: !!email,
          password: !!password,
          telephone: !!telephone,
          ville: !!ville
        }
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Email invalide' });
    }

    // Vérifier si l'email existe déjà
    const result = await db.query('SELECT id FROM signal_moi.users WHERE email = $1', [email]);
    const existing = result.rows || [];
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertResult = await db.query(
      'INSERT INTO signal_moi.users (prenom, nom, email, password, telephone, ville, quartier, date_naissance, lieu_naissance, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      [prenom, nom, email, hashedPassword, telephone, ville, quartier, dataNaissance, lieuNaissance, 'citoyen']
    );

    const newUserId = insertResult.rows[0].id;
    const token = jwt.sign({ id: newUserId, role: 'citoyen' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      success: true,
      token,
      user: { 
        id: newUserId, 
        prenom, 
        nom, 
        email, 
        role: 'citoyen' 
      }
    });
  } catch (error) {
    console.error('[AUTH REGISTER] Erreur:', error.message);
    
    if (error.message.includes('Named bind parameter')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Champs manquants ou invalides. Tous les champs sont obligatoires: prenom, nom, email, password, telephone, ville'
      });
    }
    
    if (error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cet email est déjà utilisé'
      });
    }

    if (error.message.includes('does not exist')) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur schéma base de données',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email et mot de passe obligatoires'
      });
    }

    const result = await db.query('SELECT * FROM signal_moi.users WHERE email = $1', [email]);
    const users = result.rows || [];
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[AUTH LOGIN] Erreur:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Récupérer les infos de l'utilisateur connecté
router.get('/me', protect, async (req, res) => {
  try {
    const result = await db.query('SELECT id, prenom, nom, email, telephone, ville, quartier, role, is_active FROM signal_moi.users WHERE id = $1', [req.user.id]);
    const users = result.rows || [];
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('[AUTH ME] Erreur:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/auth/profile - alias pour /me
router.get('/profile', protect, async (req, res) => {
  try {
    const result = await db.query('SELECT id, prenom, nom, email, telephone, ville, quartier, role, is_active FROM signal_moi.users WHERE id = $1', [req.user.id]);
    const users = result.rows || [];
    if (users.length === 0) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    const user = users[0];
    res.json({ success: true, user });
  } catch (error) {
    console.error('[AUTH PROFILE] Erreur:', error.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/auth/profile - mettre à jour le profil utilisateur connecté
router.put('/profile', protect, async (req, res) => {
  try {
    const { prenom, nom, telephone, ville, quartier } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;
    if (prenom !== undefined) { fields.push(`prenom = $${idx++}`); values.push(prenom) }
    if (nom !== undefined) { fields.push(`nom = $${idx++}`); values.push(nom) }
    if (telephone !== undefined) { fields.push(`telephone = $${idx++}`); values.push(telephone) }
    if (ville !== undefined) { fields.push(`ville = $${idx++}`); values.push(ville) }
    if (quartier !== undefined) { fields.push(`quartier = $${idx++}`); values.push(quartier) }

    if (fields.length === 0) return res.status(400).json({ success: false, message: 'Aucun champ à mettre à jour' });

    values.push(req.user.id);
    const query = `UPDATE signal_moi.users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, prenom, nom, email, telephone, ville, quartier, role`;
    const result = await db.query(query, values);
    const updated = result.rows[0];
    res.json({ success: true, message: 'Profil mis à jour', user: updated });
  } catch (error) {
    console.error('[AUTH PUT /profile] Erreur:', error.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/auth/change-password - changer le mot de passe de l'utilisateur connecté
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Champs requis manquants' });

    const result = await db.query('SELECT password FROM signal_moi.users WHERE id = $1', [req.user.id]);
    const userRow = result.rows[0];
    if (!userRow) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });

    const valid = await bcrypt.compare(currentPassword, userRow.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Mot de passe actuel incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE signal_moi.users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('[AUTH POST /change-password] Erreur:', error.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/auth/google - Authentification via Google OAuth (STUB - à intégrer avec Google Cloud)
router.post('/google', async (req, res) => {
  try {
    const { token, idToken, email, name, picture } = req.body;

    if (!idToken && !token) {
      return res.status(400).json({
        success: false,
        message: 'Token Google requis'
      });
    }

    // IMPORTANT: En production, vérifier le token avec Google API
    // Pour l'instant, c'est un stub qui simule l'authentification

    // Chercher ou créer l'utilisateur avec l'email Google
    const userEmail = email || 'unknown@google.com';
    
    const userRes = await db.query(
      'SELECT id, email, prenom, nom, role FROM signal_moi.users WHERE email = $1',
      [userEmail]
    );

    let userId;
    if (userRes.rows.length > 0) {
      // Utilisateur existant
      userId = userRes.rows[0].id;
      console.log('[AUTH POST /google] ✅ Utilisateur existant connecté via Google:', userEmail);
    } else {
      // Créer un nouvel utilisateur (citoyen par défaut)
      const nomComplet = name || 'Utilisateur Google';
      const nomParts = nomComplet.split(' ');
      const prenom = nomParts[0] || 'Citoyen';
      const nom = nomParts.slice(1).join(' ') || 'Google';

      // Générer un mot de passe aléatoire (l'utilisateur ne le connaît pas)
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const newUserRes = await db.query(
        `INSERT INTO signal_moi.users 
        (email, password, prenom, nom, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'citoyen', NOW(), NOW())
        RETURNING id`,
        [userEmail, hashedPassword, prenom, nom]
      );

      userId = newUserRes.rows[0].id;
      console.log('[AUTH POST /google] ✅ Nouvel utilisateur créé via Google:', userEmail);
    }

    // Générer un JWT
    const jwtToken = jwt.sign(
      { id: userId, email: userEmail },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Authentification Google réussie',
      token: jwtToken,
      user: {
        id: userId,
        email: userEmail
      }
    });

  } catch (err) {
    console.error('[AUTH POST /google] Erreur:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'authentification Google',
      details: err.message
    });
  }
});

module.exports = router;
