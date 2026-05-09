const express = require('express');
const router = express.Router();
const Campagne = require('../models/Campagne');

router.get('/', async (req, res) => {
    try {
        const campagnes = await Campagne.findAll();
        res.json(campagnes);
    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});

router.post('/', async (req, res) => {
    try {
        const newCampagne = await Campagne.create(req.body);
        res.status(201).json(newCampagne);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur création campagne' });
    }
});

module.exports = router;