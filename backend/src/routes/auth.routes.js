const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/database');
const { protect } = require('../middleware/auth.middleware');

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, city } = req.body;

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
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

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
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
