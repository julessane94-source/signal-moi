const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/database');

/**
 * POST /api/init/seed-users
 * Crée les utilisateurs admin et citoyen initiaux
 * Protection: ADMIN_SECRET_KEY requise (si configurée)
 */
router.post('/seed-users', async (req, res) => {
  try {
    const secretKey = req.headers['x-admin-secret'] || req.body.secret;
    const envSecret = process.env.ADMIN_SECRET_KEY;

    if (!envSecret) {
      return res.status(503).json({ success: false, message: 'Initialisation désactivée : ADMIN_SECRET_KEY manquante' });
    }
    const provided = Buffer.from(String(secretKey || ''));
    const expected = Buffer.from(envSecret);
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
      return res.status(401).json({
        success: false,
        message: 'Clé secrète invalide'
      });
    }

    console.log('[INIT] Création des utilisateurs de seed...');

    const usersToCreate = [
      {
        email: 'admin@signal-moi.fr',
        password: process.env.SEED_ADMIN_PASSWORD,
        prenom: 'Admin',
        nom: 'Signal-Moi',
        role: 'admin',
        telephone: '0123456789',
        ville: 'Dakar',
        quartier: 'Plateau'
      },
      {
        email: 'julessane94@gmail.com',
        password: process.env.SEED_CITIZEN_PASSWORD,
        prenom: 'Jules',
        nom: 'Sane',
        role: 'citoyen',
        telephone: '770789608',
        ville: 'Sedhiou',
        quartier: 'Centre'
      }
    ];

    if (!usersToCreate.every((user) => user.password && user.password.length >= 12)) {
      return res.status(503).json({ success: false, message: 'Les mots de passe de seed doivent être définis et comporter au moins 12 caractères.' });
    }

    const createdUsers = [];

    for (const user of usersToCreate) {
      // Vérifier si l'utilisateur existe déjà
      const checkResult = await db.query(
        'SELECT id FROM signal_moi.users WHERE email = $1',
        [user.email]
      );

      if (checkResult.rows && checkResult.rows.length > 0) {
        console.log(`[INIT] L'utilisateur ${user.email} existe déjà`);
        createdUsers.push({
          email: user.email,
          status: 'already_exists',
          message: 'Utilisateur existe déjà'
        });
        continue;
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Insérer l'utilisateur
      const insertResult = await db.query(
        `INSERT INTO signal_moi.users 
         (prenom, nom, email, password, telephone, ville, quartier, date_naissance, lieu_naissance, role, is_active, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id, email, role, created_at`,
        [
          user.prenom,
          user.nom,
          user.email,
          hashedPassword,
          user.telephone,
          user.ville,
          user.quartier,
          '1990-01-01',
          user.ville,
          user.role,
          true,
          true
        ]
      );

      if (insertResult.rows && insertResult.rows.length > 0) {
        const created = insertResult.rows[0];
        console.log(`[INIT] ✅ Utilisateur créé: ${created.email} (${created.role})`);
        createdUsers.push({
          id: created.id,
          email: created.email,
          role: created.role,
          status: 'created',
          message: 'Utilisateur créé avec succès'
        });
      }
    }

    res.json({
      success: true,
      message: 'Initialisation des utilisateurs terminée',
      users: createdUsers
    });
  } catch (error) {
    console.error('[INIT ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création des utilisateurs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
