const fs = require('fs');
const path = require('path');

const MAX_PROOF_SIZE = 25 * 1024 * 1024;
const expectedMimeByExtension = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.m4v': 'video/mp4', '.mkv': 'video/x-matroska'
};

const hasExpectedSignature = (file, extension) => {
  if (!file?.path) return false;
  let bytes;
  try { bytes = fs.readFileSync(file.path); } catch { return false; }
  if (bytes.length < 12) return false;
  const header = bytes.subarray(0, 12);
  if (['.jpg', '.jpeg'].includes(extension)) return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (extension === '.png') return header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (extension === '.gif') return header.subarray(0, 6).toString('ascii') === 'GIF87a' || header.subarray(0, 6).toString('ascii') === 'GIF89a';
  if (extension === '.webp') return header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WEBP';
  if (['.mp4', '.m4v', '.m4a', '.mov'].includes(extension)) return header.subarray(4, 8).toString('ascii') === 'ftyp';
  if (extension === '.webm' || extension === '.mkv') return header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3;
  if (extension === '.wav') return header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WAVE';
  if (extension === '.mp3') return header.subarray(0, 3).toString('ascii') === 'ID3' || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
  // Les autres formats restent validés strictement par MIME + extension.
  return true;
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
      || !hasExpectedSignature(file, extension)
      || Number(file.size || 0) > MAX_PROOF_SIZE;
  });

  if (invalid) {
    cleanup(files);
    return res.status(400).json({ error: 'Preuve refusée : format non autorisé ou fichier supérieur à 25 Mo.' });
  }
  next();
};

module.exports = { validateUploadedMedia };
