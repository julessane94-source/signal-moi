const db = require('../config/database');
const User = require('./User');
const Signalement = require('./Signalement');
const Fichier = require('./Fichier');
const Campagne = require('./Campagne');
const InscriptionCampagne = require('./InscriptionCampagne');
const Message = require('./Message');

// Définir les associations
User.hasMany(Signalement, { foreignKey: 'userId', as: 'signalements' });
Signalement.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Message, { foreignKey: 'expediteurId', as: 'messagesEnvoyes' });
User.hasMany(Message, { foreignKey: 'destinataireId', as: 'messagesRecus' });
Message.belongsTo(User, { foreignKey: 'expediteurId', as: 'expediteur' });
Message.belongsTo(User, { foreignKey: 'destinataireId', as: 'destinataire' });

Signalement.hasMany(Fichier, { foreignKey: 'signalementId', as: 'fichiers' });
Fichier.belongsTo(Signalement, { foreignKey: 'signalementId', as: 'signalement' });

User.hasMany(Campagne, { foreignKey: 'createdBy', as: 'campagnesCrees' });
Campagne.belongsTo(User, { foreignKey: 'createdBy', as: 'createur' });

User.belongsToMany(Campagne, { 
  through: InscriptionCampagne, 
  foreignKey: 'userId', 
  otherKey: 'campagneId',
  as: 'campagnesInscrites'
});
Campagne.belongsToMany(User, { 
  through: InscriptionCampagne, 
  foreignKey: 'campagneId', 
  otherKey: 'userId',
  as: 'participants'
});

Signalement.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });

module.exports = {
  db,
  User,
  Signalement,
  Fichier,
  Campagne,
  InscriptionCampagne,
  Message
};
