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
    // references removed for sync-order tolerance
  },
  campagneId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'campagne_id',
    // references removed for sync-order tolerance
  },
  statut: {
    type: DataTypes.STRING(20),
    defaultValue: 'inscrit',
    validate: {
      isIn: [['inscrit', 'present', 'absent', 'annule']]
    }
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
