const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Données en mémoire (temporaire)
let users = [
  { id: 1, prenom: "Admin", nom: "System", email: "admin@signal-moi.com", role: "admin", isActive: true },
  { id: 2, prenom: "Jean", nom: "Dupont", email: "citoyen@test.com", role: "citoyen", isActive: true }
];

let signalements = [];

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    // Essayer la base de données
    const result = await db.query('SELECT id, prenom, nom, email, role, is_active FROM users');
    res.json(result);
  } catch (error) {
    // Fallback sur les données en mémoire
    res.json(users);
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    await db.query('UPDATE users SET ? WHERE id = ?', [req.body, req.params.id]);
    res.json({ message: 'Utilisateur modifie' });
  } catch (error) {
    const index = users.findIndex(u => u.id == req.params.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...req.body };
      res.json({ message: 'Utilisateur modifie' });
    } else {
      res.status(404).json({ error: 'Utilisateur non trouve' });
    }
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'Utilisateur supprime' });
  } catch (error) {
    const index = users.findIndex(u => u.id == req.params.id);
    if (index !== -1) {
      users.splice(index, 1);
      res.json({ message: 'Utilisateur supprime' });
    } else {
      res.status(404).json({ error: 'Utilisateur non trouve' });
    }
  }
});

// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    await db.query('UPDATE users SET password = "Default123!" WHERE id = ?', [req.params.id]);
    res.json({ message: 'Mot de passe reinitialise' });
  } catch (error) {
    res.json({ message: 'Mot de passe reinitialise (mode demo)' });
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
  try {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [req.body.role, req.params.id]);
    res.json({ message: 'Role modifie' });
  } catch (error) {
    const index = users.findIndex(u => u.id == req.params.id);
    if (index !== -1) {
      users[index].role = req.body.role;
      res.json({ message: 'Role modifie' });
    } else {
      res.status(404).json({ error: 'Utilisateur non trouve' });
    }
  }
});

// GET /api/admin/signalements
router.get('/signalements', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM signalements');
    res.json(result);
  } catch (error) {
    res.json(signalements);
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = (await db.query('SELECT COUNT(*) as count FROM users'))[0].count;
    const totalSignalements = (await db.query('SELECT COUNT(*) as count FROM signalements'))[0].count;
    const activeUsers = (await db.query('SELECT COUNT(*) as count FROM users WHERE is_active = 1'))[0].count;
    res.json({ totalUsers, totalSignalements, totalCampagnes: 0, activeUsers });
  } catch (error) {
    res.json({ totalUsers: users.length, totalSignalements: signalements.length, totalCampagnes: 0, activeUsers: users.filter(u => u.isActive).length });
  }
});

// POST /api/admin/users (créer)
router.post('/users', async (req, res) => {
  const { prenom, nom, email, telephone, password, ville, quartier, role } = req.body;
  try {
    await db.query('INSERT INTO users (prenom, nom, email, telephone, password, ville, quartier, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
      [prenom, nom, email, telephone, password, ville, quartier, role || 'citoyen']);
    res.status(201).json({ message: 'Utilisateur cree' });
  } catch (error) {
    const newUser = { id: users.length + 1, prenom, nom, email, role: role || 'citoyen', isActive: true };
    users.push(newUser);
    res.status(201).json(newUser);
  }
});

module.exports = router;