const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Header Authorization manquant',
        code: 'MISSING_AUTH_HEADER'
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return res.status(401).json({ 
        error: 'Token manquant ou malformé',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    // Vérifier le JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      return res.status(401).json({ 
        error: 'Token invalide: ID utilisateur manquant',
        code: 'INVALID_TOKEN_PAYLOAD'
      });
    }

    // Récupérer l'utilisateur
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Compte utilisateur désactivé',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Erreur:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expiré',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token invalide',
        code: 'INVALID_TOKEN',
        details: error.message
      });
    }

    res.status(401).json({ 
      error: 'Authentification échouée',
      code: 'AUTH_FAILED',
      details: error.message
    });
  }
};

const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Accès non autorisé. Vous ne disposez pas des permissions nécessaires.',
        code: 'FORBIDDEN'
      });
    }
    next();
  };
};

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

const refreshTokenMiddleware = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || req.header('X-Refresh-Token');
    
    if (!refreshToken) {
      throw new Error();
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.isActive) {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Refresh token invalide ou expiré',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
};

module.exports = { 
  authMiddleware, 
  roleMiddleware, 
  optionalAuthMiddleware,
  refreshTokenMiddleware 
};
