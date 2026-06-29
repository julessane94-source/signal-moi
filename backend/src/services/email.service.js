const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM
};

const isSmtpConfigured = Boolean(
  smtpConfig.host &&
  smtpConfig.user &&
  smtpConfig.pass &&
  smtpConfig.from
);

// Configuration du transporteur
const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass
      }
    })
  : null;

if (!isSmtpConfigured) {
  logger.warn('SMTP non configure: renseigner SMTP_HOST, SMTP_USER, SMTP_PASS et SMTP_FROM pour envoyer les emails.');
}

const ensureSmtpConfigured = () => {
  if (!transporter) {
    throw new Error('SMTP non configure: renseigner SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS et SMTP_FROM.');
  }
};

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
  }),
  
  'signalement-deleted': (data) => ({
    subject: '⚠️ Votre signalement a été supprimé',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #DC2626;">Notification de suppression</h1>
        <p>Bonjour ${data.name},</p>
        <p>Votre signalement intitulé <strong>"${data.titre}"</strong> a été supprimé de la plateforme Signal-Moi.</p>
        <p><strong>Raison :</strong></p>
        <div style="background-color: #FEE2E2; padding: 15px; border-left: 4px solid #DC2626; border-radius: 5px; margin: 10px 0;">
          ${data.reason}
        </div>
        <p>Si vous estimez que cette suppression est injustifiée, veuillez nous contacter à <a href="mailto:${data.contactEmail}">${data.contactEmail}</a></p>
        <p>Merci de votre compréhension.</p>
        <p>À bientôt sur Signal-Moi</p>
      </div>
    `
  }),
  
  'campagne-deleted': (data) => ({
    subject: '⚠️ Une campagne a été supprimée',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #DC2626;">Notification de suppression</h1>
        <p>Bonjour ${data.name},</p>
        <p>La campagne <strong>"${data.titre}"</strong> à laquelle vous aviez participé a été supprimée de la plateforme Signal-Moi.</p>
        <p><strong>Raison :</strong></p>
        <div style="background-color: #FEE2E2; padding: 15px; border-left: 4px solid #DC2626; border-radius: 5px; margin: 10px 0;">
          ${data.reason}
        </div>
        <p>Si vous avez des questions, veuillez nous contacter à <a href="mailto:${data.contactEmail}">${data.contactEmail}</a></p>
        <p>Merci de votre compréhension.</p>
        <p>À bientôt sur Signal-Moi</p>
      </div>
    `
  })
};

// Envoyer un email
const sendEmail = async ({ to, subject, template, data }) => {
  try {
    ensureSmtpConfigured();
    const templateData = templates[template](data);
    
    const mailOptions = {
      from: smtpConfig.from,
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
    ensureSmtpConfigured();
    const mailOptions = {
      from: smtpConfig.from,
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
  sendSimpleEmail,
  isSmtpConfigured
};
