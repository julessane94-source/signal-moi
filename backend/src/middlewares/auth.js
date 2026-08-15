const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    // Les clients web et mobiles envoient le jeton uniquement dans l'en-tête.
    // Ne jamais accepter un jeton dans l'URL : il fuit vers les logs et le Referer.
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({ 
        error: 'Token manquant',
        code: 'MISSING_TOKEN'
      });
    }

    // Vérifier le JWT
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
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

    const isActive = user.isActive !== undefined ? user.isActive : user.is_active !== false;

    if (isActive === false) {
      return res.status(401).json({ 
        error: 'Compte utilisateur désactivé',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Erreur:', error.name, error.message);
    if (error.stack) console.error(error.stack.split('\n').slice(0,3).join('\n'));
    
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
      const isActive = user?.isActive !== undefined ? user.isActive : user?.is_active !== false;
      if (user && isActive !== false) {
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
    
    const isActive = user?.isActive !== undefined ? user.isActive : user?.is_active !== false;
    if (!user || isActive === false) {
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
