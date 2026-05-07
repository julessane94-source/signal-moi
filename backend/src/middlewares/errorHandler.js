const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log de l'erreur
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: req.user?.id
  });

  // Erreur Sequelize
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Conflit de données',
      details: err.errors.map(e => ({
        field: e.path,
        message: 'Cette valeur existe déjà'
      }))
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token invalide',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expiré',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Erreur par défaut
  const status = err.status || 500;
  const message = err.message || 'Erreur interne du serveur';

  res.status(status).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR'
  });
};

module.exports = errorHandler;
