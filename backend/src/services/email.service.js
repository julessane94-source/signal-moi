const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Configuration du transporteur
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Templates d'emails
const templates = {
  welcome: (data) => ({
    subject: 'Bienvenue sur Signal-Moi !',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Bienvenue ${data.name} !</h1>
        <p>Merci de vous être inscrit sur Signal-Moi, la plateforme de signalement citoyen.</p>
        <p>Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
        <a href="${data.verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Vérifier mon email</a>
        <p>Ou copiez ce lien dans votre navigateur : ${data.verificationUrl}</p>
        <p>À très bientôt sur Signal-Moi !</p>
      </div>
    `
  }),
  
  'reset-password': (data) => ({
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Bonjour ${data.name}</h1>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
        <a href="${data.resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a>
        <p>Ce lien est valable 1 heure.</p>
        <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      </div>
    `
  }),
  
  'status-change': (data) => ({
    subject: `Mise à jour de votre signalement #${data.signalementId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Mise à jour de votre signalement</h1>
        <p>Le statut de votre signalement a été mis à jour :</p>
        <p><strong>Nouveau statut :</strong> ${data.nouveauStatut}</p>
        <p><strong>Commentaire :</strong> ${data.commentaire || 'Aucun commentaire'}</p>
        <a href="${data.signalementUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Voir mon signalement</a>
      </div>
    `
  }),
  
  'new-message': (data) => ({
    subject: `Nouveau message de ${data.expediteur}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Nouveau message</h1>
        <p>Vous avez reçu un nouveau message de ${data.expediteur} :</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${data.message}
        </div>
        <a href="${data.messageUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Voir le message</a>
      </div>
    `
  })
};

// Envoyer un email
const sendEmail = async ({ to, subject, template, data }) => {
  try {
    const templateData = templates[template](data);
    
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject: subject || templateData.subject,
      html: templateData.html
    };
    
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email envoyé à ${to}`, { messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error(`Erreur envoi email à ${to}:`, error);
    throw error;
  }
};

// Envoyer un email simple
const sendSimpleEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      html
    };
    
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email simple envoyé à ${to}`);
    return info;
  } catch (error) {
    logger.error(`Erreur envoi email simple à ${to}:`, error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendSimpleEmail
};
