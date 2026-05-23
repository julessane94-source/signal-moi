// backend/src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SiteConfig = require('../models/SiteConfig');

// ? Middleware d'authentification admin
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token d\'authentification manquant' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
        
        // V�rifier que c'est un admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Acc�s administrateur requis' });
        }
        
        req.user = decoded;
        next();
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
// GET /api/admin/users - R�cup�re la liste de tous les utilisateurs (prot�g�)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT id, prenom, nom, email, telephone, ville, quartier, role, is_active FROM signal_moi.users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('[ADMIN GET /users] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// POST /api/admin/users - Cr�e un nouvel utilisateur (prot�g�)
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
      INSERT INTO users (prenom, nom, email, telephone, password, ville, quartier, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, prenom, nom, email, role
    `;
    const values = [prenom, nom, email, telephone, hashed, ville, quartier, role || 'citoyen'];
    const result = await db.query(insertQuery, values);
    console.log('[ADMIN POST /users] Utilisateur cr��:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[ADMIN POST /users] Erreur SQL:', err);
    res.status(500).json({ error: 'Erreur lors de la cr�ation', details: err.message });
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

router.post('/site-config', authMiddleware, async (req, res) => {
  try {
    const { siteName, contactEmail, contactPhone, address, contactPage, aboutPage, homePage } = req.body;
    if (!siteName || !contactEmail || !contactPhone || !address) {
      return res.status(400).json({ error: 'Les champs de base (siteName, contactEmail, contactPhone, address) sont requis' });
    }

    const tasks = [
      SiteConfig.set('siteName', siteName),
      SiteConfig.set('contactEmail', contactEmail),
      SiteConfig.set('contactPhone', contactPhone),
      SiteConfig.set('address', address)
    ];

    if (contactPage !== undefined) tasks.push(SiteConfig.set('contact_page', JSON.stringify(contactPage)));
    if (aboutPage !== undefined) tasks.push(SiteConfig.set('about_page', JSON.stringify(aboutPage)));
    if (homePage !== undefined) tasks.push(SiteConfig.set('home_page', JSON.stringify(homePage)));

    await Promise.all(tasks);
    res.json({ success: true });
  } catch (err) {
    console.error('[ADMIN POST /site-config] Erreur:', err);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde', details: err.message });
  }
});

module.exports = router;



