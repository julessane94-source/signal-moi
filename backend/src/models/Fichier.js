const { DataTypes } = require('sequelize');
const db = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

const Fichier = db.define('Fichier', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  signalementId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'signalement_id',
    references: {
      model: 'signalements',
      key: 'id'
    }
  },
  nomFichier: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'nom_fichier'
  },
  chemin: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('image', 'video', 'audio', 'document'),
    allowNull: false
  },
  taille: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      max: 10485760 // 10MB
    }
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'mime_type'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified'
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'uploaded_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'fichiers',
  timestamps: true,
  underscored: true
});

// Méthodes d'instance
Fichier.prototype.getUrl = function() {
  return `${process.env.API_URL}/${this.chemin}`;
};

Fichier.prototype.getFileSizeInMB = function() {
  return (this.taille / (1024 * 1024)).toFixed(2);
};

Fichier.prototype.deleteFile = async function() {
  try {
    await fs.unlink(path.join(__dirname, '../../', this.chemin));
    return true;
  } catch (error) {
    console.error('Erreur suppression fichier:', error);
    return false;
  }
};

// Hook de suppression physique
Fichier.addHook('afterDestroy', async (fichier) => {
  await fichier.deleteFile();
});

module.exports = Fichier;
