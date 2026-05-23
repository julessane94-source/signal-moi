const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/database');
const { protect } = require('../middleware/auth.middleware');

// Inscription
router.post('/register', async (req, res) => {
  try {
    // Support des deux formats : camelCase (firstName) et snake_case (first_name)
    const firstName = req.body.firstName || req.body.first_name || req.body.prenom;
    const lastName = req.body.lastName || req.body.last_name || req.body.nom;
    const email = req.body.email;
    const password = req.body.password;
    const phone = req.body.phone || req.body.telephone;
    const city = req.body.city || req.body.ville;

    // Validation des champs obligatoires
    if (!firstName || !lastName || !email || !password || !phone || !city) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tous les champs sont obligatoires',
        missing: {
          firstName: !firstName,
          lastName: !lastName,
          email: !email,
          password: !password,
          phone: !phone,
          city: !city
        }
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Email invalide' });
    }

    // Vérifier si l'email existe déjà
    const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    const existing = result.rows || [];
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertResult = await db.query(
      'INSERT INTO users (first_name, last_name, email, password, phone, city, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [firstName, lastName, email, hashedPassword, phone, city, 'citizen']
    );

    const newUserId = insertResult.rows[0].id;
    const token = jwt.sign({ id: newUserId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      success: true,
      token,
      user: { id: newUserId, firstName, lastName, email, role: 'citizen' }
    });
  } catch (error) {
    console.error('[AUTH REGISTER] Erreur:', error.message);
    
    if (error.message.includes('Named bind parameter')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Champs manquants ou invalides. Tous les champs sont obligatoires: firstName, lastName, email, password, phone, city'
      });
    }
    
    if (error.message.includes('duplicate key')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cet email est déjà utilisé'
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

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const users = result.rows || [];
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
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

module.exports = router;
