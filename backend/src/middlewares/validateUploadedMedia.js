const fs = require('fs');
const path = require('path');

const MAX_PROOF_SIZE = 100 * 1024 * 1024;
const expectedMimesByExtension = {
  '.jpg': ['image/jpeg'], '.jpeg': ['image/jpeg'], '.png': ['image/png'], '.webp': ['image/webp'], '.gif': ['image/gif'], '.bmp': ['image/bmp'], '.tif': ['image/tiff'], '.tiff': ['image/tiff'], '.heic': ['image/heic', 'image/heif'], '.heif': ['image/heif'], '.avif': ['image/avif'],
  '.mp3': ['audio/mpeg'], '.wav': ['audio/wav', 'audio/x-wav'], '.m4a': ['audio/mp4', 'audio/x-m4a'], '.aac': ['audio/aac'], '.ogg': ['audio/ogg'], '.oga': ['audio/ogg'], '.opus': ['audio/ogg', 'audio/opus'], '.flac': ['audio/flac', 'audio/x-flac'], '.amr': ['audio/amr'], '.wma': ['audio/x-ms-wma'],
  '.mp4': ['video/mp4'], '.webm': ['video/webm'], '.mov': ['video/quicktime'], '.m4v': ['video/x-m4v', 'video/mp4'], '.mkv': ['video/x-matroska'], '.avi': ['video/x-msvideo', 'video/avi'], '.3gp': ['video/3gpp'], '.3g2': ['video/3gpp2'], '.mpeg': ['video/mpeg'], '.mpg': ['video/mpeg'], '.ts': ['video/mp2t'], '.mts': ['video/mp2t'], '.m2ts': ['video/mp2t'], '.flv': ['video/x-flv'], '.wmv': ['video/x-ms-wmv'],
  '.pdf': ['application/pdf'], '.doc': ['application/msword'], '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], '.xls': ['application/vnd.ms-excel'], '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], '.ppt': ['application/vnd.ms-powerpoint'], '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'], '.odt': ['application/vnd.oasis.opendocument.text'], '.ods': ['application/vnd.oasis.opendocument.spreadsheet'], '.odp': ['application/vnd.oasis.opendocument.presentation'], '.rtf': ['application/rtf', 'text/rtf'], '.txt': ['text/plain'], '.csv': ['text/csv', 'application/vnd.ms-excel']
};

const hasExpectedSignature = (file, extension) => {
  if (!file?.path) return false;
  const header = Buffer.alloc(16);
  let bytesRead = 0;
  try {
    const descriptor = fs.openSync(file.path, 'r');
    bytesRead = fs.readSync(descriptor, header, 0, header.length, 0);
    fs.closeSync(descriptor);
  } catch {
    return false;
  }
  if (bytesRead === 0) return false;
  if (['.jpg', '.jpeg'].includes(extension)) return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (extension === '.png') return header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (extension === '.gif') return header.subarray(0, 6).toString('ascii') === 'GIF87a' || header.subarray(0, 6).toString('ascii') === 'GIF89a';
  if (extension === '.webp') return header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WEBP';
  if (['.mp4', '.m4v', '.m4a', '.mov'].includes(extension)) return header.subarray(4, 8).toString('ascii') === 'ftyp';
  if (extension === '.webm' || extension === '.mkv') return header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3;
  if (extension === '.wav') return header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WAVE';
  if (extension === '.mp3') return header.subarray(0, 3).toString('ascii') === 'ID3' || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
  if (extension === '.pdf') return header.subarray(0, 5).toString('ascii') === '%PDF-';
  if (['.doc', '.xls', '.ppt'].includes(extension)) return header.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  if (['.docx', '.xlsx', '.pptx', '.odt', '.ods', '.odp'].includes(extension)) return header.subarray(0, 2).toString('ascii') === 'PK';
  if (extension === '.rtf') return header.subarray(0, 5).toString('ascii') === '{\\rtf';
  if (extension === '.txt' || extension === '.csv') return true;
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
    const expectedMimes = expectedMimesByExtension[extension];
    return !expectedMimes
      || !expectedMimes.includes(file.mimetype)
      || !hasExpectedSignature(file, extension)
      || Number(file.size || 0) > MAX_PROOF_SIZE;
  });

  if (invalid) {
    cleanup(files);
    return res.status(400).json({ error: 'Preuve refusée : format non autorisé ou fichier supérieur à 100 Mo.' });
  }
  next();
};

module.exports = { validateUploadedMedia };
