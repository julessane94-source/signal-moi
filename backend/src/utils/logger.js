const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'signal-moi-api' },
  transports: [
    // Console - toujours afficher pour le debugging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Écrire tous les logs dans un fichier
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Gérer les erreurs Winston
logger.on('error', (error) => {
  console.error('Winston logger error:', error);
});

// Ajouter console fallback pour la production
if (process.env.NODE_ENV === 'production') {
  // Les logs vont à la console ET aux fichiers
}

module.exports = logger;
