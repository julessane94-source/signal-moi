const db = require('../config/database');
const User = require('./User');
const Signalement = require('./Signalement');
const Fichier = require('./Fichier');
const Campagne = require('./Campagne');
const InscriptionCampagne = require('./InscriptionCampagne');
const Message = require('./Message');
const FollowedCase = require('./FollowedCase');
const Post = require('./Post');

// Définir les associations uniquement si les modèles sont des modèles Sequelize
const isSequelizeModel = (m) => m && typeof m === 'function' && typeof m.associate === 'undefined' && (m.hasMany || m.belongsTo || m.belongsToMany || m.schema);

try {
  if (isSequelizeModel(User) && isSequelizeModel(Signalement)) {
    User.hasMany(Signalement, { foreignKey: 'userId', as: 'signalements' });
    Signalement.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  }

  if (isSequelizeModel(User) && isSequelizeModel(Message)) {
    User.hasMany(Message, { foreignKey: 'expediteurId', as: 'messagesEnvoyes' });
    User.hasMany(Message, { foreignKey: 'destinataireId', as: 'messagesRecus' });
    Message.belongsTo(User, { foreignKey: 'expediteurId', as: 'expediteur' });
    Message.belongsTo(User, { foreignKey: 'destinataireId', as: 'destinataire' });
  }

  if (isSequelizeModel(Signalement) && isSequelizeModel(Fichier)) {
    Signalement.hasMany(Fichier, { foreignKey: 'signalementId', as: 'fichiers' });
    Fichier.belongsTo(Signalement, { foreignKey: 'signalementId', as: 'signalement' });
  }

  if (isSequelizeModel(User) && isSequelizeModel(Campagne)) {
    User.hasMany(Campagne, { foreignKey: 'createdBy', as: 'campagnesCrees' });
    Campagne.belongsTo(User, { foreignKey: 'createdBy', as: 'createur' });
  }

  if (isSequelizeModel(User) && isSequelizeModel(Campagne) && isSequelizeModel(InscriptionCampagne)) {
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
  }

  if (isSequelizeModel(Signalement) && isSequelizeModel(User)) {
    // association optionnelle: assignedTo
    if (typeof Signalement.belongsTo === 'function') {
      Signalement.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
    }
  }

    if (isSequelizeModel(User) && isSequelizeModel(Post)) {
      User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
      Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
    }
} catch (err) {
  console.warn('Warning setting up associations:', err.message);
}

module.exports = {
  db,
  User,
  Signalement,
  Fichier,
  Campagne,
  InscriptionCampagne,
  Message
  ,FollowedCase
    ,Post
};
