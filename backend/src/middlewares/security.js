const rateLimit = require('express-rate-limit');

// Headers de sécurité supplémentaires
const securityHeaders = (req, res, next) => {
  // Désactiver le X-Powered-By
  res.removeHeader('X-Powered-By');
  
  // Ajouter des headers de sécurité
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(self), camera=(self)');
  
  next();
};

// Rate limiting spécifique pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives
  message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes',
  skipSuccessfulRequests: true
});

// Rate limiting pour les signalements
const signalementLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 signalements par heure
  message: 'Vous avez atteint la limite de signalements, veuillez réessayer plus tard'
});

// Rate limiting pour l'upload
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // 20 uploads par heure
  message: 'Limite d\'upload atteinte, veuillez réessayer plus tard'
});

module.exports = {
  securityHeaders,
  authLimiter,
  signalementLimiter,
  uploadLimiter
};
