const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Signalement = require('../models/Signalement');
const SiteConfig = require('../models/SiteConfig');

router.get('/users', async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.post('/users', async (req, res) => {
    try {
        const newUser = await User.create(req.body);
        res.status(201).json(newUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur création' });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const updated = await User.update(req.params.id, req.body);
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur mise à jour' });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        await User.delete(req.params.id);
        res.json({ message: 'Utilisateur supprimé' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur suppression' });
    }
});

router.patch('/users/:id/role', async (req, res) => {
    try {
        const updated = await User.updateRole(req.params.id, req.body.role);
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur modification rôle' });
    }
});

router.post('/users/:id/reset-password', async (req, res) => {
    try {
        await User.resetPassword(req.params.id);
        res.json({ message: 'Mot de passe réinitialisé à Default123!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur réinitialisation' });
    }
});

router.get('/signalements', async (req, res) => {
    try {
        const signalements = await Signalement.findAll();
        res.json(signalements);
    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});

router.get('/stats', async (req, res) => {
    try {
        const users = await User.findAll();
        const signalements = await Signalement.findAll();
        res.json({
            totalUsers: users.length,
            totalSignalements: signalements.length,
            activeUsers: users.filter(u => u.is_active).length
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ totalUsers: 0, totalSignalements: 0, activeUsers: 0 });
    }
});

router.get('/config', async (req, res) => {
    try {
        const config = await SiteConfig.getAll();
        res.json(config);
    } catch (err) {
        res.status(500).json({});
    }
});

router.post('/config', async (req, res) => {
    try {
        for (const [cle, valeur] of Object.entries(req.body)) {
            await SiteConfig.set(cle, valeur);
        }
        res.json({ message: 'Configuration sauvegardée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur sauvegarde' });
    }
});

module.exports = router;