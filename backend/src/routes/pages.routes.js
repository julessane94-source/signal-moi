// backend/src/routes/pages.routes.js
// Routes PUBLIQUES pour accéder aux pages du site (accueil, contact, à propos)
// Pas d'authentification requise - accessible par le frontend

const express = require('express');
const router = express.Router();
const SiteConfig = require('../models/SiteConfig');

// GET /api/pages/all - Récupère TOUTES les pages (publiques)
router.get('/all', async (req, res) => {
  try {
    const config = await SiteConfig.getAll();
    
    // Retourner seulement les pages, pas les infos d'admin
    const pages = {
      siteName: config.siteName || 'Signal-Moi',
      home: config.home_page || {},
      contact: config.contact_page || {},
      about: config.about_page || {}
    };
    
    console.log('[PUBLIC GET /pages/all] ✅ Retournant les pages publiques');
    res.json(pages);
  } catch (err) {
    console.error('[PUBLIC GET /pages/all] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// GET /api/pages/home - Récupère la page d'accueil
router.get('/home', async (req, res) => {
  try {
    const config = await SiteConfig.getAll();
    const homePage = config.home_page || {
      title: 'Accueil',
      heroText: 'Bienvenue sur Signal-Moi',
      content: 'Plateforme citoyenne'
    };
    
    console.log('[PUBLIC GET /pages/home] ✅ Page d\'accueil retournée');
    res.json(homePage);
  } catch (err) {
    console.error('[PUBLIC GET /pages/home] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// GET /api/pages/contact - Récupère la page de contact
router.get('/contact', async (req, res) => {
  try {
    const config = await SiteConfig.getAll();
    const contactPage = config.contact_page || {
      title: 'Nous Contacter',
      description: 'Formulaire de contact'
    };
    
    console.log('[PUBLIC GET /pages/contact] ✅ Page de contact retournée');
    res.json(contactPage);
  } catch (err) {
    console.error('[PUBLIC GET /pages/contact] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// GET /api/pages/about - Récupère la page "À propos"
router.get('/about', async (req, res) => {
  try {
    const config = await SiteConfig.getAll();
    const aboutPage = config.about_page || {
      title: 'À Propos',
      description: 'Informations sur Signal-Moi'
    };
    
    console.log('[PUBLIC GET /pages/about] ✅ Page "À propos" retournée');
    res.json(aboutPage);
  } catch (err) {
    console.error('[PUBLIC GET /pages/about] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// GET /api/pages/config - Récupère les infos de contact/config du site (PUBLIQUES)
router.get('/config', async (req, res) => {
  try {
    const config = await SiteConfig.getAll();
    
    // Retourner seulement les infos publiques
    const publicConfig = {
      siteName: config.siteName || 'Signal-Moi',
      contactEmail: config.contactEmail || 'contact@signal-moi.fr',
      contactPhone: config.contactPhone || '',
      address: config.address || ''
    };
    
    console.log('[PUBLIC GET /pages/config] ✅ Config publique retournée');
    res.json(publicConfig);
  } catch (err) {
    console.error('[PUBLIC GET /pages/config] Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

module.exports = router;
