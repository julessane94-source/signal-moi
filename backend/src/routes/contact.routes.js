// backend/src/routes/contact.routes.js
// Routes de gestion des messages de contact depuis le formulaire du frontend
// Ces messages sont sauvegardés et envoyés aux administrateurs

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const nodemailer = require('nodemailer');

// Configurer le transporteur email (utilise les variables d'env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// POST /api/contact/send - Envoyer un message de contact
router.post('/send', async (req, res) => {
  try {
    const {
      nom,
      name,
      email,
      sujet,
      subject,
      message,
      telephone
    } = req.body;

    const contactName = nom || name;
    const contactSubject = sujet || subject;
    const contactMessage = message;

    // Validation des champs obligatoires
    if (!contactName || !email || !contactSubject || !contactMessage) {
      return res.status(400).json({
        success: false,
        message: 'Les champs nom, email, sujet et message sont obligatoires'
      });
    }

    // Validation basique du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Récupérer l'adresse email des administrateurs
    const adminsRes = await db.query(`
      SELECT email FROM signal_moi.users 
      WHERE role = 'admin' AND email IS NOT NULL
      LIMIT 5
    `);
    const adminEmails = adminsRes.rows.map(row => row.email);

    if (adminEmails.length === 0) {
      console.warn('[POST /contact/send] ⚠️ Aucun email admin trouvé, message non envoyé');
      // On sauvegarde quand même le message
    }

    // Sauvegarder le message de contact en base de données
    const contactRes = await db.query(`
      INSERT INTO signal_moi.contact_messages 
      (nom, email, telephone, sujet, message, created_at, statut)
      VALUES ($1, $2, $3, $4, $5, NOW(), 'nouveau')
      RETURNING id, created_at
    `, [contactName, email, telephone || null, contactSubject, contactMessage]);

    const contactId = contactRes.rows[0]?.id;
    const createdAt = contactRes.rows[0]?.created_at;

    // Envoyer l'email aux administrateurs (si SMTP configuré)
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD && adminEmails.length > 0) {
      try {
        const emailContent = `
          <h2>Nouveau Message de Contact</h2>
          <p><strong>Nom:</strong> ${contactName}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${telephone ? `<p><strong>Téléphone:</strong> ${telephone}</p>` : ''}
          <p><strong>Sujet:</strong> ${contactSubject}</p>
          <hr>
          <p><strong>Message:</strong></p>
          <p>${contactMessage.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>ID du message: #${contactId} | Reçu le: ${new Date(createdAt).toLocaleString('fr-FR')}</small></p>
        `;

        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: adminEmails.join(', '),
          subject: `[Signal-Moi] Nouveau message: ${contactSubject}`,
          html: emailContent
        });

        console.log('[POST /contact/send] ✅ Message sauvegardé et email envoyé aux admins');
      } catch (emailErr) {
        console.error('[POST /contact/send] ⚠️ Erreur lors de l\'envoi du mail:', emailErr.message);
        // Ne pas bloquer la réponse si l'email échoue
      }
    } else {
      console.log('[POST /contact/send] ✅ Message sauvegardé (email SMTP non configuré)');
    }

    // Envoyer aussi un email de confirmation à l'utilisateur
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: email,
          subject: 'Signal-Moi - Confirmation de réception',
          html: `
            <h2>Merci de nous avoir contactés</h2>
            <p>Votre message a bien été reçu.</p>
            <p><strong>Référence:</strong> #${contactId}</p>
            <p>Nous vous répondrons dans les meilleurs délais.</p>
            <hr>
            <p><strong>Votre message:</strong></p>
            <p>${contactMessage.replace(/\n/g, '<br>')}</p>
          `
        });
      } catch (emailErr) {
        console.error('[POST /contact/send] ⚠️ Erreur lors de l\'envoi de confirmation:', emailErr.message);
      }
    }

    // Retourner une réponse positiva
    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès. Nous vous répondrons dans les meilleurs délais.',
      contactId: contactId
    });

  } catch (err) {
    console.error('[POST /contact/send] Erreur:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      details: err.message
    });
  }
});

// GET /api/contact/messages - Récupérer les messages (ADMIN ONLY)
router.get('/messages', async (req, res) => {
  try {
    // Vérifier l'authentification et les droits admin (via middleware normalement)
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les administrateurs peuvent accéder à cette ressource.'
      });
    }

    // Récupérer tous les messages de contact
    const messagesRes = await db.query(`
      SELECT id, nom, email, telephone, sujet, message, statut, created_at
      FROM signal_moi.contact_messages
      ORDER BY created_at DESC
      LIMIT 100
    `);

    console.log('[GET /contact/messages] ✅ Messages récupérés');
    res.json({
      success: true,
      messages: messagesRes.rows
    });

  } catch (err) {
    console.error('[GET /contact/messages] Erreur:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      details: err.message
    });
  }
});

module.exports = router;
