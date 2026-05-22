const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/database');

router.post('/register', async (req, res) => {
    const { prenom, nom, email, telephone, password, ville, quartier } = req.body;
    if (!prenom || !nom || !email || !telephone || !password || !ville || !quartier) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    try {
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            `INSERT INTO users (prenom, nom, email, telephone, password, ville, quartier, role)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'citoyen')
             RETURNING id, prenom, nom, email, role`,
            [prenom, nom, email, telephone, hashedPassword, ville, quartier]
        );
        const newUser = result.rows[0];
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET || 'dev-secret-key',
            { expiresIn: '7d' }
        );
        res.status(201).json({ message: 'Inscription réussie', token, user: newUser });
    } catch (err) {
        console.error('Erreur inscription:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        // ✅ FIX: Use bcrypt.compare to verify hashed password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'dev-secret-key',
            { expiresIn: '7d' }
        );
        const { password: _, ...userData } = user;
        res.json({ message: 'Connexion réussie', token, user: userData });
    } catch (err) {
        console.error('Erreur connexion:', err);
        res.status(500).json({ error: 'Erreur serveur', details: err.message });
    }
});

module.exports = router;



