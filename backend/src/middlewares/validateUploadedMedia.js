const fs = require('fs');
const path = require('path');

const MAX_PROOF_SIZE = 25 * 1024 * 1024;
const expectedMimeByExtension = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.m4v': 'video/mp4', '.mkv': 'video/x-matroska'
};

const cleanup = (files) => {
  files.forEach((file) => {
    if (file?.path) fs.unlink(file.path, () => {});
  });
};

const validateUploadedMedia = (req, res, next) => {
  const files = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
  const invalid = files.find((file) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    return !expectedMimeByExtension[extension]
      || expectedMimeByExtension[extension] !== file.mimetype
      || Number(file.size || 0) > MAX_PROOF_SIZE;
  });

  if (invalid) {
    cleanup(files);
    return res.status(400).json({ error: 'Preuve refusée : format non autorisé ou fichier supérieur à 25 Mo.' });
  }
  next();
};

module.exports = { validateUploadedMedia };
