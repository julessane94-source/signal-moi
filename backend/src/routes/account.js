const express = require('express');
const router = express.Router();
const { User, Signalement } = require('../models');
const { authMiddleware } = require('../middlewares/auth');
const bcrypt = require('bcrypt');

// Supprimer le compte utilisateur
// DELETE /api/auth/account
// Body: { password: string } - Pour confirmation
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Le mot de passe est requis pour confirmer' });
    }

    // Récupérer l'utilisateur
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // Récupérer tous les signalements de l'utilisateur
    const signalements = await Signalement.findAll({
      where: { user_id: userId }
    });

    // Séparer les signalements à garder (résolus et en cours) des autres
    const signalementsAGarder = signalements.filter(s => 
      ['traite', 'en_cours', 'transfere'].includes(s.statut)
    );

    const signalementsASupprimer = signalements.filter(s => 
      !['traite', 'en_cours', 'transfere'].includes(s.statut)
    );

    // Anonymiser les signalements résolus/en cours
    if (signalementsAGarder.length > 0) {
      await Promise.all(
        signalementsAGarder.map(s => 
          s.update({
            user_id: null, // Détacher l'utilisateur
            prenom: 'Anonyme',
            nom: 'Utilisateur supprimé',
            email: null,
            telephone: null
          })
        )
      );
    }

    // Supprimer les autres signalements et leurs fichiers
    if (signalementsASupprimer.length > 0) {
      const signalementIds = signalementsASupprimer.map(s => s.id);
      
      // Supprimer les fichiers associés
      await require('../models').Fichier.destroy({
        where: { signalement_id: signalementIds }
      });

      // Supprimer les historiques
      await require('../models').HistoriqueSignalement.destroy({
        where: { signalement_id: signalementIds }
      });

      // Supprimer les signalements
      await Signalement.destroy({
        where: { id: signalementIds }
      });
    }

    // Supprimer l'utilisateur
    await user.destroy();

    return res.json({
      success: true,
      message: 'Compte supprimé avec succès. Les signalements résolus et en cours ont été conservés de manière anonyme.',
      signalementsConserves: signalementsAGarder.length,
      signalementsSupprimes: signalementsASupprimer.length
    });

  } catch (error) {
    console.error('Erreur suppression compte:', error);
    return res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
  }
});

// Route GET pour récupérer les signalements de l'utilisateur (avant suppression)
// GET /api/auth/my-signalements
router.get('/my-signalements', authMiddleware, async (req, res) => {
  try {
    const signalements = await Signalement.findAll({
      where: { user_id: req.user.id },
      attributes: ['id', 'titre', 'type', 'statut', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    const stats = {
      total: signalements.length,
      traite: signalements.filter(s => s.statut === 'traite').length,
      en_cours: signalements.filter(s => s.statut === 'en_cours').length,
      transfere: signalements.filter(s => s.statut === 'transfere').length,
      aSupprimer: signalements.filter(s => 
        !['traite', 'en_cours', 'transfere'].includes(s.statut)
      ).length
    };

    return res.json({
      success: true,
      signalements,
      stats
    });

  } catch (error) {
    console.error('Erreur récupération signalements:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
