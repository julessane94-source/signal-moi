const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Campagne, InscriptionCampagne, User } = require('../models');
const { authMiddleware, roleMiddleware, optionalAuthMiddleware } = require('../middlewares/auth');

// GET /api/campagnes/public - liste publique des campagnes actives et à venir
router.get('/public', async (req, res) => {
  try {
    const now = new Date();
    const campagnes = await Campagne.findAll({
      where: {
        estActif: true,
        dateFin: { [Op.gte]: now }
      },
      order: [['dateDebut', 'ASC']]
    });

    const result = await Promise.all(campagnes.map(async (c) => {
      const placesRestantes = await c.getPlacesRestantes();
      return Object.assign({}, c.toJSON(), { placesRestantes });
    }));

    res.json(result);
  } catch (error) {
    console.error('Erreur GET /api/campagnes/public', error);
    res.status(500).json({ error: 'Impossible de récupérer les campagnes' });
  }
});

// GET /api/campagnes/:id - détail d'une campagne
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const campagne = await Campagne.findByPk(id, {
      include: [{ model: User, as: 'createur', attributes: ['id', 'prenom', 'nom', 'email', 'telephone'] }]
    });
    if (!campagne) return res.status(404).json({ error: 'Campagne introuvable' });

    const placesRestantes = await campagne.getPlacesRestantes();
    const isFull = await campagne.isFull();
    res.json(Object.assign({}, campagne.toJSON(), { placesRestantes, isFull }));
  } catch (error) {
    console.error('Erreur GET /api/campagnes/:id', error);
    res.status(500).json({ error: 'Impossible de récupérer la campagne' });
  }
});

// POST /api/campagnes - créer une campagne (collaborateur / admin)
router.post('/', authMiddleware, roleMiddleware('collaborateur', 'admin'), async (req, res) => {
  try {
    const payload = req.body;
    payload.createdBy = req.user.id;
    const campagne = await Campagne.create(payload);
    res.status(201).json(campagne);
  } catch (error) {
    console.error('Erreur POST /api/campagnes', error);
    res.status(400).json({ error: error.message || 'Impossible de créer la campagne' });
  }
});

// POST /api/campagnes/:id/inscriptions - inscription (utilisateur connecté)
router.post('/:id/inscriptions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const campagne = await Campagne.findByPk(id);
    if (!campagne) return res.status(404).json({ error: 'Campagne introuvable' });

    if (await campagne.isFull()) {
      return res.status(409).json({ error: 'Capacité atteinte' });
    }

    // Vérifier inscription existante
    const exists = await InscriptionCampagne.findOne({ where: { userId: req.user.id, campagneId: id } });
    if (exists) return res.status(409).json({ error: 'Vous êtes déjà inscrit(e) à cette campagne' });

    const inscription = await InscriptionCampagne.create({ userId: req.user.id, campagneId: id });
    res.status(201).json(inscription);
  } catch (error) {
    console.error('Erreur POST /api/campagnes/:id/inscriptions', error);
    res.status(500).json({ error: 'Impossible de créer l\'inscription' });
  }
});

// GET /api/campagnes/:id/inscriptions - liste des inscrits (collaborateur/admin or creator)
router.get('/:id/inscriptions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const campagne = await Campagne.findByPk(id);
    if (!campagne) return res.status(404).json({ error: 'Campagne introuvable' });

    // Autoriser le créateur ou les rôles collaborateur/admin
    if (req.user.id !== campagne.createdBy && !['collaborateur', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const inscriptions = await InscriptionCampagne.findAll({
      where: { campagneId: id },
      include: [{ model: User, as: 'user', attributes: ['id', 'prenom', 'nom', 'email', 'telephone'] }],
      order: [['dateInscription', 'ASC']]
    });

    res.json(inscriptions);
  } catch (error) {
    console.error('Erreur GET /api/campagnes/:id/inscriptions', error);
    res.status(500).json({ error: 'Impossible de récupérer les inscriptions' });
  }
});

module.exports = router;