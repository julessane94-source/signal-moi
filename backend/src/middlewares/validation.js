const { body, param, query, validationResult } = require('express-validator');

// Middleware de validation
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      error: 'Erreur de validation',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  };
};

// Validations utilisateur
const userValidations = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    body('prenom').notEmpty().trim().isLength({ min: 2 }).withMessage('Prénom requis'),
    body('nom').notEmpty().trim().isLength({ min: 2 }).withMessage('Nom requis'),
    body('telephone').matches(/^[0-9+\-\s]{8,20}$/).withMessage('Téléphone invalide'),
    body('ville').notEmpty().withMessage('Ville requise'),
    body('quartier').notEmpty().withMessage('Quartier requis'),
    body('dateNaissance').isDate().withMessage('Date de naissance invalide'),
    body('lieuNaissance').notEmpty().withMessage('Lieu de naissance requis')
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis')
  ],
  updateProfile: [
    body('prenom').optional().trim().isLength({ min: 2 }),
    body('nom').optional().trim().isLength({ min: 2 }),
    body('telephone').optional().matches(/^[0-9+\-\s]{8,20}$/),
    body('ville').optional().notEmpty(),
    body('quartier').optional().notEmpty()
  ]
};

// Validations signalement
const signalementValidations = {
  create: [
    body('titre').notEmpty().trim().isLength({ min: 5, max: 100 }).withMessage('Titre invalide'),
    body('description').notEmpty().isLength({ min: 10, max: 5000 }).withMessage('Description invalide'),
    body('type').isIn(['violence', 'vol', 'probleme_eclairage', 'nid_de_poule', 'incendie', 'accident', 'bruit', 'autre']).withMessage('Type invalide'),
    body('localisation').notEmpty().withMessage('Localisation requise'),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
    body('estAnonyme').optional().isBoolean()
  ],
  updateStatus: [
    param('id').isUUID().withMessage('ID invalide'),
    body('statut').isIn(['nouveau', 'en_cours', 'traite', 'transfere', 'rejete']).withMessage('Statut invalide')
  ]
};

// Validations campagne
const campagneValidations = {
  create: [
    body('titre').notEmpty().trim().isLength({ min: 5, max: 200 }).withMessage('Titre invalide'),
    body('description').notEmpty().isLength({ min: 20 }).withMessage('Description invalide'),
    body('type').isIn(['formation', 'activite', 'sensibilisation', 'marche', 'conference', 'autre']).withMessage('Type invalide'),
    body('dateDebut').isISO8601().withMessage('Date de début invalide'),
    body('dateFin').isISO8601().withMessage('Date de fin invalide'),
    body('lieu').notEmpty().withMessage('Lieu requis'),
    body('capaciteMax').optional().isInt({ min: 1, max: 10000 })
  ]
};

// Validations message
const messageValidations = {
  send: [
    body('destinataireId').isUUID().withMessage('Destinataire invalide'),
    body('contenu').notEmpty().isLength({ max: 5000 }).withMessage('Message invalide')
  ]
};

// Validation ID param
const idValidation = [
  param('id').isUUID().withMessage('ID invalide')
];

// Pagination validation
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
];

module.exports = {
  validate,
  userValidations,
  signalementValidations,
  campagneValidations,
  messageValidations,
  idValidation,
  paginationValidation
};
