const { User } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { sendEmail } = require('../services/email.service');
const logger = require('../utils/logger');

class AuthController {
  // Inscription
  static async register(req, res) {
    try {
      const userData = req.body;
      
      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
      
      // Créer le token de vérification email
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      
      // Créer l'utilisateur
      const user = await User.create({
        ...userData,
        emailVerificationToken,
        role: userData.role || 'citoyen'
      });
      
      // Envoyer l'email de vérification
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`;
      await sendEmail({
        to: user.email,
        subject: 'Bienvenue sur Signal-Moi - Vérifiez votre email',
        template: 'welcome',
        data: {
          name: `${user.prenom} ${user.nom}`,
          verificationUrl
        }
      });
      
      // Générer les tokens
      const token = user.generateAuthToken();
      const refreshToken = user.generateRefreshToken();
      
      res.status(201).json({
        message: 'Inscription réussie. Veuillez vérifier votre email.',
        token,
        refreshToken,
        user: user.toJSON()
      });
    } catch (error) {
      logger.error('Erreur inscription:', error);
      res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
  }
  
  // Vérification email
  static async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      
      const user = await User.findOne({
        where: {
          emailVerificationToken: token,
          emailVerified: false
        }
      });
      
      if (!user) {
        return res.status(400).json({ error: 'Token invalide ou expiré' });
      }
      
      user.emailVerified = true;
      user.emailVerificationToken = null;
      await user.save();
      
      res.json({ message: 'Email vérifié avec succès' });
    } catch (error) {
      logger.error('Erreur vérification email:', error);
      res.status(500).json({ error: 'Erreur lors de la vérification' });
    }
  }
  
  // Connexion
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Trouver l'utilisateur
      const user = await User.findOne({ where: { email } });
      
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }
      
      // Vérifier le mot de passe
      const isValid = await user.validatePassword(password);
      if (!isValid) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }
      
      // Vérifier si l'email est vérifié
      if (!user.emailVerified && process.env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Veuillez vérifier votre email avant de vous connecter' });
      }
      
      // 2FA
      if (user.twoFactorEnabled) {
        return res.json({
          requires2FA: true,
          userId: user.id
        });
      }
      
      // Mettre à jour last_login
      user.lastLogin = new Date();
      await user.save();
      
      // Générer les tokens
      const token = user.generateAuthToken();
      const refreshToken = user.generateRefreshToken();
      
      // Logger la connexion
      logger.info(`Utilisateur connecté: ${user.email}`);
      
      res.json({
        message: 'Connexion réussie',
        token,
        refreshToken,
        user: user.toJSON()
      });
    } catch (error) {
      logger.error('Erreur login:', error);
      res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
  }
  
  // Rafraîchir le token
  static async refreshToken(req, res) {
    try {
      const user = req.user;
      const token = user.generateAuthToken();
      const refreshToken = user.generateRefreshToken();
      
      res.json({
        token,
        refreshToken
      });
    } catch (error) {
      logger.error('Erreur refresh token:', error);
      res.status(500).json({ error: 'Erreur lors du rafraîchissement' });
    }
  }
  
  // Déconnexion
  static async logout(req, res) {
    try {
      // Ici on pourrait blacklister le token
      logger.info(`Utilisateur déconnecté: ${req.user.email}`);
      res.json({ message: 'Déconnexion réussie' });
    } catch (error) {
      logger.error('Erreur logout:', error);
      res.status(500).json({ error: 'Erreur lors de la déconnexion' });
    }
  }
  
  // Mot de passe oublié
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ where: { email } });
      if (!user) {
        // Ne pas révéler que l'email n'existe pas
        return res.json({ message: 'Si cet email existe, vous recevrez un lien de réinitialisation' });
      }
      
      // Générer le token
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 heure
      await user.save();
      
      // Envoyer l'email
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      await sendEmail({
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe Signal-Moi',
        template: 'reset-password',
        data: {
          name: `${user.prenom} ${user.nom}`,
          resetUrl
        }
      });
      
      res.json({ message: 'Email de réinitialisation envoyé' });
    } catch (error) {
      logger.error('Erreur forgot password:', error);
      res.status(500).json({ error: 'Erreur lors de la demande' });
    }
  }
  
  // Réinitialisation mot de passe
  static async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      const user = await User.findOne({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { [Op.gt]: new Date() }
        }
      });
      
      if (!user) {
        return res.status(400).json({ error: 'Token invalide ou expiré' });
      }
      
      user.password = password;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      
      res.json({ message: 'Mot de passe réinitialisé avec succès' });
    } catch (error) {
      logger.error('Erreur reset password:', error);
      res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
    }
  }
  
  // Obtenir mon profil
  static async getProfile(req, res) {
    res.json(req.user);
  }
  
  // Mettre à jour mon profil
  static async updateProfile(req, res) {
    try {
      const user = req.user;
      const updates = req.body;
      
      // Empêcher la mise à jour de certains champs
      delete updates.id;
      delete updates.email;
      delete updates.role;
      delete updates.password;
      
      await user.update(updates);
      
      res.json({
        message: 'Profil mis à jour',
        user: user.toJSON()
      });
    } catch (error) {
      logger.error('Erreur update profile:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
  }
  
  // Changer mot de passe
  static async changePassword(req, res) {
    try {
      const user = req.user;
      const { currentPassword, newPassword } = req.body;
      
      const isValid = await user.validatePassword(currentPassword);
      if (!isValid) {
        return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
      }
      
      user.password = newPassword;
      await user.save();
      
      res.json({ message: 'Mot de passe modifié avec succès' });
    } catch (error) {
      logger.error('Erreur change password:', error);
      res.status(500).json({ error: 'Erreur lors du changement' });
    }
  }
  
  // Activer 2FA
  static async enable2FA(req, res) {
    try {
      const user = req.user;
      
      const secret = speakeasy.generateSecret({
        name: `${process.env.TWO_FACTOR_APP_NAME}:${user.email}`
      });
      
      user.twoFactorSecret = secret.base32;
      await user.save();
      
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
      
      res.json({
        secret: secret.base32,
        qrCode: qrCodeUrl
      });
    } catch (error) {
      logger.error('Erreur enable 2FA:', error);
      res.status(500).json({ error: 'Erreur lors de l\'activation' });
    }
  }
  
  // Désactiver 2FA
  static async disable2FA(req, res) {
    try {
      const user = req.user;
      
      user.twoFactorEnabled = false;
      user.twoFactorSecret = null;
      await user.save();
      
      res.json({ message: '2FA désactivé' });
    } catch (error) {
      logger.error('Erreur disable 2FA:', error);
      res.status(500).json({ error: 'Erreur lors de la désactivation' });
    }
  }
  
  // Vérifier 2FA
  static async verify2FA(req, res) {
    try {
      const user = req.user;
      const { token } = req.body;
      
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token
      });
      
      if (!verified) {
        return res.status(401).json({ error: 'Code 2FA invalide' });
      }
      
      user.twoFactorEnabled = true;
      await user.save();
      
      res.json({ message: '2FA activé avec succès' });
    } catch (error) {
      logger.error('Erreur verify 2FA:', error);
      res.status(500).json({ error: 'Erreur lors de la vérification' });
    }
  }
}

module.exports = AuthController;
