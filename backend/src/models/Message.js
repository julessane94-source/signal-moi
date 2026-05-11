const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Message = db.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  expediteurId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'expediteur_id',
    // references removed for sync-order tolerance
  },
  destinataireId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'destinataire_id',
    // references removed for sync-order tolerance
  },
  signalementId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'signalement_id',
    // references removed for sync-order tolerance
  },
  contenu: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 5000]
    }
  },
  estLu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'est_lu'
  },
  dateLecture: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'date_lecture'
  },
  piecesJointes: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'pieces_jointes'
  },
  isDeletedBySender: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_deleted_by_sender'
  },
  isDeletedByReceiver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_deleted_by_receiver'
  }
}, {
  tableName: 'messages',
  timestamps: true,
  underscored: true
});

// Méthodes d'instance
Message.prototype.markAsRead = async function() {
  if (!this.estLu) {
    this.estLu = true;
    this.dateLecture = new Date();
    await this.save();
  }
};

module.exports = Message;
