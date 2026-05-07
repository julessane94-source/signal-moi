const express = require('express');
const router = express.Router();

// Stockage temporaire en mémoire des signalements (persistant tant que le serveur tourne)
const signalements = [
  {
    id: '1',
    titre: 'Nid-de-poule dangereux',
    description: 'Un énorme nid-de-poule au carrefour',
    type: 'nid_de_poule',
    statut: 'en_cours',
    localisation: 'Carrefour Mvan',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    titre: 'Vol dans le quartier',
    description: "Vol de téléphone hier soir",
    type: 'vol',
    statut: 'nouveau',
    localisation: 'Quartier Bastos',
    createdAt: new Date().toISOString()
  }
];

// Liste des signalements
router.get('/', (req, res) => {
  res.json(signalements);
});

// Récupérer un signalement par id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const found = signalements.find(s => s.id === id);
  if (!found) return res.status(404).json({ error: 'Signalement introuvable' });
  return res.json(found);
});

// Créer un signalement (ajout en mémoire)
router.post('/', (req, res) => {
  const newSignal = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    statut: req.body.statut || 'nouveau'
  };
  signalements.unshift(newSignal);
  res.status(201).json(newSignal);
});

// Lancer une alerte (simulation)
router.post('/:id/alert', (req, res) => {
  const { id } = req.params;
  const found = signalements.find(s => s.id === id);
  if (!found) return res.status(404).json({ error: 'Signalement introuvable' });
  // Ici on simule l'envoi d'une alerte vers un service externe
  console.log(`Alerte lancée pour signalement ${id}`);
  return res.json({ status: 'alerte_lancee', id });
});

module.exports = router;