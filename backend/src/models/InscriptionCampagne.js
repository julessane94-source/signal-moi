const { DataTypes } = require('sequelize');
const db = require('../config/database');

const InscriptionCampagne = db.define('InscriptionCampagne', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  campagneId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'campagne_id',
    references: {
      model: 'campagnes',
      key: 'id'
    }
  },
  statut: {
    type: DataTypes.ENUM('inscrit', 'present', 'absent', 'annule'),
    defaultValue: 'inscrit'
  },
  dateInscription: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'date_inscription'
  },
  datePresence: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'date_presence'
  },
  codeQr: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'code_qr'
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'inscriptions_campagnes',
  timestamps: true,
  underscored: true
});

module.exports = InscriptionCampagne;
