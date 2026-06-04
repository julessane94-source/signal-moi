const { DataTypes } = require('sequelize');
const db = require('../config/database');

const Post = db.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  content_html: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  featured_image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'posts',
  schema: process.env.DB_SCHEMA || 'public',
  underscored: true,
  timestamps: true
});

module.exports = Post;
