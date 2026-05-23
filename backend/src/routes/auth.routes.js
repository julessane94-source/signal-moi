const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/database');
const { protect } = require('../middleware/auth.middleware');

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
    const token = jwt.sign({ id: newUserId }, process.env.JWT_SECRET, { expiresIn: '7d' });
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

module.exports = router;
