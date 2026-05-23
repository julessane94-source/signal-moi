const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/database');

/**
 * POST /api/init/seed-users
 * Crée les utilisateurs admin et citoyen initiaux
 * Protection: ADMIN_SECRET_KEY requise
 */
router.post('/seed-users', async (req, res) => {
  try {
    const secretKey = req.headers['x-admin-secret'] || req.body.secret;
    
    // Vérifier la clé secrète
    if (secretKey !== process.env.ADMIN_SECRET_KEY || !process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Clé secrète invalide ou non configurée'
      });
    }

    console.log('[INIT] Création des utilisateurs de seed...');

    const usersToCreate = [
      {
        email: 'admin@signal-moi.fr',
        password: 'Admin123!',
        prenom: 'Admin',
        nom: 'Signal-Moi',
        role: 'admin',
        telephone: '0123456789',
        ville: 'Dakar',
        quartier: 'Plateau'
      },
      {
        email: 'julessane94@gmail.com',
        password: 'Admin123!',
        prenom: 'Jules',
        nom: 'Sane',
        role: 'citoyen',
        telephone: '770789608',
        ville: 'Thies',
        quartier: 'Centre'
      }
    ];

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
          password: user.password,
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
