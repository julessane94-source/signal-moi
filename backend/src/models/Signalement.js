const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Signalement = db.define('Signalement', {
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
  titre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [5, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [10, 5000]
    }
  },
  type: {
    type: DataTypes.ENUM('violence', 'vol', 'probleme_eclairage', 'nid_de_poule', 'incendie', 'accident', 'bruit', 'autre'),
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM('nouveau', 'en_cours', 'traite', 'transfere', 'rejete'),
    defaultValue: 'nouveau'
  },
  priorite: {
    type: DataTypes.ENUM('basse', 'moyenne', 'haute', 'urgente'),
    defaultValue: 'moyenne'
  },
  localisation: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: -90,
      max: 90
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: -180,
      max: 180
    }
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estAnonyme: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'est_anonyme'
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'assigned_to',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  transferredFrom: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'transferred_from'
  },
  dateSignalement: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'date_signalement'
  },
  dateResolution: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'date_resolution'
  },
  commentaireResolution: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'commentaire_resolution'
  },
  viewsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'views_count'
  },
  upvotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'signalements',
  timestamps: true,
  underscored: true,
  paranoid: true
});

// Méthodes d'instance
Signalement.prototype.incrementViews = async function() {
  this.viewsCount += 1;
  await this.save();
};

Signalement.prototype.getFormattedDate = function() {
  return new Date(this.dateSignalement).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Méthodes statiques
Signalement.findByUser = async function(userId) {
  return await this.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });
};

Signalement.findByStatus = async function(statut) {
  return await this.findAll({
    where: { statut },
    order: [['priorite', 'DESC'], ['createdAt', 'ASC']]
  });
};

module.exports = Signalement;
