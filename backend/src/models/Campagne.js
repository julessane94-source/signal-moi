const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Campagne = db.define('Campagne', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  titre: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [5, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [20, 5000]
    }
  },
  type: {
    type: DataTypes.ENUM('formation', 'activite', 'sensibilisation', 'marche', 'conference', 'autre'),
    allowNull: false
  },
  dateDebut: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'date_debut',
    validate: {
      isDate: true
    }
  },
  dateFin: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'date_fin',
    validate: {
      isAfterDate(value) {
        if (value <= this.dateDebut) {
          throw new Error('La date de fin doit être après la date de début');
        }
      }
    }
  },
  lieu: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  capaciteMax: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    field: 'capacite_max',
    validate: {
      min: 1,
      max: 10000
    }
  },
  prix: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  estActif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'est_actif'
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'image_url'
  },
  bannerUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'banner_url'
  },
  programme: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prerequis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  materiel: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contactOrganisateur: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'contact_organisateur'
  }
}, {
  tableName: 'campagnes',
  timestamps: true,
  underscored: true,
  paranoid: true
});

// Méthodes d'instance
Campagne.prototype.getPlacesRestantes = async function() {
  const inscriptions = await db.models.InscriptionCampagne.count({
    where: {
      campagneId: this.id,
      statut: 'inscrit'
    }
  });
  return this.capaciteMax - inscriptions;
};

Campagne.prototype.isFull = async function() {
  const placesRestantes = await this.getPlacesRestantes();
  return placesRestantes <= 0;
};

Campagne.prototype.isActive = function() {
  const now = new Date();
  return this.estActif && now >= this.dateDebut && now <= this.dateFin;
};

module.exports = Campagne;
