const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const fs = require('fs')
const path = require('path')
const configPath = path.join(__dirname, '..', 'config', 'siteConfig.json')

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await db.query('SELECT id, prenom, nom, email, telephone, ville, quartier, role, is_active FROM users');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json([]);
  }
});

// GET /api/admin/users/test (route temporaire pour test d'encodage)
router.get('/users/test', (req, res) => {
  res.json([
    {
      id: 'test-1',
      prenom: 'Gérard',
      nom: 'Dufréne',
      email: 'gerard.dufrene@example.test',
      telephone: '0123456789',
      ville: 'Saint-Étienne',
      quartier: 'Centre',
      role: 'citoyen',
      is_active: 1
    }
  ]);
});

// POST /api/admin/users - CREER
router.post('/users', async (req, res) => {
  const { prenom, nom, email, telephone, password, ville, quartier, role } = req.body;
  
  try {
    const existing = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email deja utilise' });
    }
    
    const id = require('crypto').randomUUID();
    await db.query(
      `INSERT INTO users (id, prenom, nom, email, telephone, password, ville, quartier, role, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [id, prenom, nom, email, telephone, password, ville, quartier, role || 'citoyen']
    );
    
    res.status(201).json({ message: 'Utilisateur cree' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur' });
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  try {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'Role modifie' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

// PATCH /api/admin/users/:id/toggle-status
router.patch('/users/:id/toggle-status', async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  
  try {
    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive, id]);
    res.json({ message: 'Statut modifie' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', async (req, res) => {
  const { id } = req.params;
  const newPassword = 'Default123!';
  
  try {
    await db.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, id]);
    res.json({ message: 'Mot de passe reinitialise' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Utilisateur supprime' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur' });
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [users] = await db.query('SELECT COUNT(*) as total FROM users');
    const [signalements] = await db.query('SELECT COUNT(*) as total FROM signalements');
    const [campagnes] = await db.query('SELECT COUNT(*) as total FROM campagnes');
    const [active] = await db.query('SELECT COUNT(*) as total FROM users WHERE is_active = 1');
    
    res.json({
      totalUsers: users.total,
      totalSignalements: signalements.total,
      totalCampagnes: campagnes.total,
      activeUsers: active.total
    });
  } catch (error) {
    res.status(500).json({ totalUsers: 0, totalSignalements: 0, totalCampagnes: 0 });
  }
});

// GET /api/admin/config
router.get('/config', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8')
      const cfg = JSON.parse(raw)
      return res.json(cfg)
    }
    // defaults
    return res.json({ title: 'Signal-Moi', contactEmail: 'contact@signal-moi.com', phone: '+237 600 000 000', address: 'Yaounde, Cameroun', mapEnabled: false })
  } catch (error) {
    console.error(error)
    res.status(500).json({})
  }
})

// PATCH /api/admin/config
router.patch('/config', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const payload = req.body || {}
    const cfg = {
      title: payload.title || 'Signal-Moi',
      contactEmail: payload.contactEmail || 'contact@signal-moi.com',
      phone: payload.phone || '+237 600 000 000',
      address: payload.address || 'Yaounde, Cameroun',
      mapEnabled: payload.mapEnabled === true
    }
    // ensure config dir exists
    const cfgDir = path.dirname(configPath)
    if (!fs.existsSync(cfgDir)) fs.mkdirSync(cfgDir, { recursive: true })
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8')
    res.json({ message: 'Config sauvegardee', config: cfg })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erreur' })
  }
})

module.exports = router;