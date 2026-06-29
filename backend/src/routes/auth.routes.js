const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/database');
const { protect } = require('../middleware/auth.middleware');
const SiteConfig = require('../models/SiteConfig');
const { persistHomePageImages } = require('../utils/imageStorage');
const { sendSimpleEmail } = require('../services/email.service');

const normalizeLogoUrl = (value) => {
  if (!value || typeof value !== 'string') return '/icons/icon-192x192.png';
  if (value.startsWith('data:')) return value;

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      return parsed.pathname || '/icons/icon-192x192.png';
    } catch (err) {
      return '/icons/icon-192x192.png';
    }
  }

  return value;
};

const publicConfigCache = 'public, max-age=60, stale-while-revalidate=300';
const buildLogoUrl = (logoRecord) => {
  if (!logoRecord?.logo_data) return null;
  const version = logoRecord.updated_at ? new Date(logoRecord.updated_at).getTime() : Date.now();
  return `/uploads/logo?v=${version}`;
};

// GET /api/auth/site-config - Récupère la configuration du site (PUBLIC - sans auth)
router.get('/site-config', async (req, res) => {
  try {
    const config = await SiteConfig.getAll();
    if (config.home_page && typeof config.home_page === 'object') {
      const persisted = await persistHomePageImages(config.home_page);
      if (persisted.changed) {
        config.home_page = persisted.homePage;
        await SiteConfig.set('home_page', JSON.stringify(persisted.homePage));
      }
    }
    
    // Récupérer le logo en base64 s'il existe
    let logoUrl = normalizeLogoUrl(config.logoUrl || config.logo_url || '/icons/icon-192x192.png');
    const logoRecord = await SiteConfig.getLogoBinary();
    logoUrl = buildLogoUrl(logoRecord) || logoUrl;
    
    // Coerce certains champs pour éviter les erreurs côté client
    const safeConfig = {
      ...config,
      logoUrl: logoUrl,
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
      // Ensure clients don't serve a stale cached copy for site-config
      res.set('Cache-Control', publicConfigCache);
      res.json({ ...safeConfig, collaboratorCampaigns });
    } catch (err) {
      console.error('[GET /site-config] Erreur campagnes:', err);
      res.set('Cache-Control', publicConfigCache);
      res.json(safeConfig);
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
    res.set('Cache-Control', publicConfigCache);
    res.json(defaultConfig);
  }
});

// GET /api/pages/users - Récupère la liste des utilisateurs par rôle (PUBLIC - pour About page)
router.get('/pages/users', async (req, res) => {
  try {
    const role = req.query.role || 'collaborateur';
    const allowedRoles = ['collaborateur', 'police'];
    
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Role invalide' });
    }
    
    const result = await db.query(
      'SELECT id, prenom, nom, ville, quartier, role, is_active FROM signal_moi.users WHERE role = $1 AND is_active = true ORDER BY created_at DESC',
      [role]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('[GET /pages/users] Erreur:', err);
    res.json([]);
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
    const { token, idToken } = req.body;
    const googleToken = idToken || token;

    if (!googleToken) {
      return res.status(400).json({
        success: false,
        message: 'Token Google requis'
      });
    }

    // IMPORTANT: En production, vérifier le token avec Google API
    // Pour l'instant, c'est un stub qui simule l'authentification

    // Chercher ou créer l'utilisateur avec l'email Google
    const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(googleToken)}`);
    if (!googleResponse.ok) {
      return res.status(401).json({ success: false, message: 'Token Google invalide' });
    }

    const googleProfile = await googleResponse.json();
    const expectedClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (expectedClientId && googleProfile.aud !== expectedClientId) {
      return res.status(401).json({ success: false, message: 'Application Google non autorisee' });
    }
    if (googleProfile.email_verified !== true && googleProfile.email_verified !== 'true') {
      return res.status(401).json({ success: false, message: 'Email Google non verifie' });
    }

    const userEmail = googleProfile.email;
    const displayName = googleProfile.name || `${googleProfile.given_name || ''} ${googleProfile.family_name || ''}`.trim() || 'Utilisateur Google';
    
    const userRes = await db.query(
      'SELECT id, email, prenom, nom, role FROM signal_moi.users WHERE email = $1',
      [userEmail]
    );

    let userId;
    let userRole = 'citoyen';
    if (userRes.rows.length > 0) {
      // Utilisateur existant
      userId = userRes.rows[0].id;
      userRole = userRes.rows[0].role || 'citoyen';
      console.log('[AUTH POST /google] ✅ Utilisateur existant connecté via Google:', userEmail);
    } else {
      // Créer un nouvel utilisateur (citoyen par défaut)
      const nomComplet = displayName;
      const nomParts = nomComplet.split(' ');
      const prenom = nomParts[0] || 'Citoyen';
      const nom = nomParts.slice(1).join(' ') || 'Google';

      // Générer un mot de passe aléatoire (l'utilisateur ne le connaît pas)
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const newUserRes = await db.query(
        `INSERT INTO signal_moi.users 
        (email, password, prenom, nom, role, is_active, email_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'citoyen', true, true, NOW(), NOW())
        RETURNING id`,
        [userEmail, hashedPassword, prenom, nom]
      );

      userId = newUserRes.rows[0].id;
      console.log('[AUTH POST /google] ✅ Nouvel utilisateur créé via Google:', userEmail);
    }

    // Générer un JWT
    const jwtToken = jwt.sign(
      { id: userId, email: userEmail, role: userRole },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Authentification Google réussie',
      token: jwtToken,
      user: {
        id: userId,
        email: userEmail,
        role: userRole
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

// POST /api/auth/forgot-password - Demander un code de réinitialisation
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requis' });
    }

    // Vérifier que l'utilisateur existe
    const userResult = await db.query('SELECT id, email FROM signal_moi.users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // Ne pas révéler si l'email existe ou non (sécurité)
      return res.json({ success: true, message: 'Si cet email existe, un code a été envoyé' });
    }

    // Générer un code aléatoire
    const crypto = require('crypto');
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Créer la table si elle n'existe pas (au premier appel)
    await db.query(`
      CREATE TABLE IF NOT EXISTS signal_moi.password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_reset_email ON signal_moi.password_reset_tokens(email);
    `);

    // Supprimer les anciens codes pour cet email
    await db.query('DELETE FROM signal_moi.password_reset_tokens WHERE email = $1 AND used = false', [email]);

    // Insérer le nouveau code
    await db.query(
      'INSERT INTO signal_moi.password_reset_tokens (user_id, email, code, expires_at) VALUES ($1, $2, $3, $4)',
      [userResult.rows[0].id, email, code, expiresAt]
    );

    // Envoyer l'email avec le code (simulation - à intégrer avec Nodemailer)
    try {
      await sendSimpleEmail({
        to: email,
        subject: 'Code de reinitialisation Signal-Moi',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
            <h2 style="color: #4f46e5;">Code de reinitialisation</h2>
            <p>Bonjour,</p>
            <p>Votre code pour reinitialiser le mot de passe Signal-Moi est :</p>
            <div style="font-size: 28px; font-weight: 800; letter-spacing: 6px; background: #f3f4f6; padding: 16px; text-align: center; border-radius: 12px;">${code}</div>
            <p>Ce code expire dans 15 minutes.</p>
            <p>Si vous n'avez pas demande cette action, ignorez cet email.</p>
          </div>
        `
      });
    } catch (mailError) {
      console.warn('[FORGOT PASSWORD] Email non envoye:', mailError.message);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[FORGOT PASSWORD] Code pour ${email}: ${code}`);
      }
    }
    
    // Réponse sécurisée
    res.json({ 
      success: true, 
      message: 'Si cet email existe, un code a été envoyé',
      // DEBUG ONLY - À SUPPRIMER EN PRODUCTION
      ...(process.env.NODE_ENV === 'development' && { code })
    });

  } catch (error) {
    console.error('[AUTH FORGOT PASSWORD] Erreur:', error.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/auth/verify-reset-code - Vérifier le code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email et code requis' });
    }

    const result = await db.query(
      'SELECT id FROM signal_moi.password_reset_tokens WHERE email = $1 AND code = $2 AND used = false AND expires_at > NOW()',
      [email, code]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Code invalide ou expiré' });
    }

    res.json({ success: true, message: 'Code valide' });

  } catch (error) {
    console.error('[AUTH VERIFY RESET CODE] Erreur:', error.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/auth/reset-password - Réinitialiser le mot de passe
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({ success: false, message: 'Email, code et mot de passe requis' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit faire au moins 8 caractères' });
    }

    // Vérifier le code
    const tokenResult = await db.query(
      'SELECT user_id FROM signal_moi.password_reset_tokens WHERE email = $1 AND code = $2 AND used = false AND expires_at > NOW()',
      [email, code]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Code invalide ou expiré' });
    }

    const userId = tokenResult.rows[0].user_id;

    // Hasher et mettre à jour le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('UPDATE signal_moi.users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    // Marquer le code comme utilisé
    await db.query('UPDATE signal_moi.password_reset_tokens SET used = true WHERE email = $1 AND code = $2', [email, code]);

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });

  } catch (error) {
    console.error('[AUTH RESET PASSWORD] Erreur:', error.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
