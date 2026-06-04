const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const { Post, User } = require('../models');
const { uploadSingle } = require('../middlewares/upload');
const { Op } = require('sequelize');

// Simple slugify
const slugify = (s) => s.toString().toLowerCase().trim()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/--+/g, '-')
  .replace(/^-+|-+$/g, '');

// List posts (public: only published)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { published: true },
      attributes: ['id','title','slug','excerpt','featured_image','published_at'],
      include: [{ model: User, as: 'author', attributes: ['id','prenom','nom'] }],
      order: [['published_at','DESC']]
    });
    res.json({ success: true, data: posts });
  } catch (err) {
    console.error('Posts list error', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get post by slug
router.get('/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ where: { slug: req.params.slug }, include: [{ model: User, as: 'author', attributes: ['id','prenom','nom'] }] });
    if (!post) return res.status(404).json({ error: 'Post non trouvé' });
    if (!post.published) return res.status(403).json({ error: 'Post non publié' });
    res.json({ success: true, data: post });
  } catch (err) {
    console.error('Get post error', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create post (admin)
router.post('/', authMiddleware, roleMiddleware('admin'), uploadSingle('featured'), async (req, res) => {
  try {
    const { title, excerpt, content_html, published } = req.body;
    const slugBase = slugify(title || 'post');
    let slug = slugBase;
    let i = 1;
    while (await Post.findOne({ where: { slug } })) {
      slug = `${slugBase}-${i++}`;
    }

    const featured_image = req.file ? `/uploads/${req.file.filename}` : null;

    const post = await Post.create({
      title,
      slug,
      excerpt,
      content_html,
      featured_image,
      published: published === 'true' || published === true,
      published_at: (published === 'true' || published === true) ? new Date() : null,
      authorId: req.user.id
    });

    res.json({ success: true, data: post });
  } catch (err) {
    console.error('Create post error', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update post (admin)
router.put('/:id', authMiddleware, roleMiddleware('admin'), uploadSingle('featured'), async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post non trouvé' });

    const { title, excerpt, content_html, published } = req.body;
    if (title && title !== post.title) {
      const slugBase = slugify(title);
      let slug = slugBase;
      let i = 1;
      while (await Post.findOne({ where: { slug, id: { [Op.ne]: post.id } } })) {
        slug = `${slugBase}-${i++}`;
      }
      post.slug = slug;
      post.title = title;
    }

    if (excerpt) post.excerpt = excerpt;
    if (content_html) post.content_html = content_html;
    if (req.file) post.featured_image = `/uploads/${req.file.filename}`;
    const willPublish = (published === 'true' || published === true);
    if (willPublish && !post.published) {
      post.published = true;
      post.published_at = new Date();
    } else if (!willPublish) {
      post.published = false;
      post.published_at = null;
    }

    await post.save();
    res.json({ success: true, data: post });
  } catch (err) {
    console.error('Update post error', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete post (admin)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post non trouvé' });
    await post.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error('Delete post error', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
