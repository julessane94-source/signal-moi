const express = require('express');
const router = express.Router();
const { uploadSingle } = require('../middlewares/upload');

// Test upload endpoint
router.post('/upload', ...uploadSingle('file'), (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Aucun fichier reçu' });

    // multer-s3 exposes `location`; disk storage exposes `path`/`filename`
    let url = null;
    if (file.location) {
      url = file.location;
    } else if (file.path) {
      // normalize for local dev
      const apiUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
      // file.path may be absolute or relative
      const rel = file.path.replace(/^.*uploads\//, 'uploads/');
      url = `${apiUrl}/${rel}`;
    } else if (file.key) {
      // multer-s3 may provide key
      const bucket = process.env.S3_BUCKET;
      const region = process.env.S3_REGION || process.env.AWS_REGION;
      url = `https://${bucket}.s3.${region}.amazonaws.com/${file.key}`;
    }

    return res.json({
      message: 'Upload OK',
      filename: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      url
    });
  } catch (err) {
    console.error('Test upload error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
