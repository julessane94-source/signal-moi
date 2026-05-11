const { DataTypes } = require('sequelize');
const db = require('../config/database');
const path = require('path');
const fs = require('fs').promises;
const USE_S3 = process.env.USE_S3 === 'true';
let S3 = null;
if (USE_S3) {
  const AWS = require('aws-sdk');
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
  S3 = new AWS.S3({
    accessKeyId,
    secretAccessKey,
    region: process.env.S3_REGION || process.env.AWS_REGION
  });
}

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
    // references removed for sync-order tolerance
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
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['image', 'video', 'audio', 'document']]
    }
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
    // references removed for sync-order tolerance
  }
}, {
  tableName: 'fichiers',
  timestamps: true,
  underscored: true
});

// Méthodes d'instance
Fichier.prototype.getUrl = function() {
  // If chemin is a full URL already, return it
  if (!this.chemin) return null;
  if (this.chemin.startsWith('http')) return this.chemin;

  // If using S3, build S3 URL
  if (USE_S3 && process.env.S3_BUCKET && (process.env.S3_REGION || process.env.AWS_REGION)) {
    const region = process.env.S3_REGION || process.env.AWS_REGION;
    return `https://${process.env.S3_BUCKET}.s3.${region}.amazonaws.com/${this.chemin}`;
  }

  return `${process.env.API_URL}/${this.chemin}`;
};

Fichier.prototype.getFileSizeInMB = function() {
  return (this.taille / (1024 * 1024)).toFixed(2);
};

Fichier.prototype.deleteFile = async function() {
  try {
    // If using S3 and chemin looks like an S3 key or URL, delete from S3
    if (USE_S3 && S3) {
      let key = this.chemin;
      if (!key) return false;
      // If full URL, extract key after bucket path
      if (key.startsWith('http')) {
        const url = new URL(key);
        key = url.pathname.replace(/^\//, '');
      }
      await S3.deleteObject({ Bucket: process.env.S3_BUCKET, Key: key }).promise();
      return true;
    }

    // Fallback: local filesystem
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
