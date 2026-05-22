const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const { authMiddleware } = require('../middlewares/auth');

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

// POST /api/auth/google - login / register via Google id_token
router.post('/google', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ error: 'idToken requis' });

        // Validate token with Google
        const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (!resp.ok) return res.status(400).json({ error: 'Token Google invalide' });
        const info = await resp.json();

        const email = info.email;
        if (!email) return res.status(400).json({ error: 'Email non fourni par Google' });

        // Find existing user
        const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = existing.rows[0];
        if (!user) {
            // create user
            const prenom = info.given_name || email.split('@')[0];
            const nom = info.family_name || '';
            const randomPwd = Math.random().toString(36).slice(-12) + '!A1';
            const hashed = await bcrypt.hash(randomPwd, 10);
            const insert = await db.query(`INSERT INTO users (prenom, nom, email, password, role, is_active) VALUES ($1, $2, $3, $4, 'citoyen', true) RETURNING *`, [prenom, nom, email, hashed]);
            user = insert.rows[0];
        }

        // create JWT
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev-secret-key', { expiresIn: '7d' });
        const { password: _, ...userData } = user;
        res.json({ message: 'Connexion via Google réussie', token, user: userData });
    } catch (err) {
        console.error('Erreur /auth/google:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// GET /api/auth/profile - retourne l'utilisateur authentifié
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        // `authMiddleware` place l'instance Sequelize `User` sur `req.user` ou un objet similaire
        const user = req.user;
        if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
        // Si `user` est une instance Sequelize, appeler toJSON pour exclure champs sensibles
        const payload = typeof user.toJSON === 'function' ? user.toJSON() : user;
        delete payload.password;
        res.json(payload);
    } catch (err) {
        console.error('Erreur /profile:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});



