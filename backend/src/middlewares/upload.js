const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Option S3
const USE_S3 = process.env.USE_S3 === 'true';
let s3 = null;
let multerS3 = null;
if (USE_S3) {
  s3 = require('aws-sdk/clients/s3');
  multerS3 = require('multer-s3');
}

// Configuration du stockage
const uploadsRoot = path.resolve(__dirname, '..', '..', 'uploads');
let storage;
if (USE_S3 && s3 && multerS3) {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
  const s3client = new s3({
    accessKeyId,
    secretAccessKey,
    region: process.env.S3_REGION || process.env.AWS_REGION
  });

  storage = multerS3({
    s3: s3client,
    bucket: process.env.S3_BUCKET,
    acl: 'private',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      let prefix = 'temp/';
      if (req.baseUrl.includes('signalements')) prefix = 'signalements/';
      if (req.baseUrl.includes('profile')) prefix = 'profiles/';
      cb(null, `${prefix}${uniqueName}`);
    }
  });
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath = path.join(uploadsRoot, 'temp');
      if (req.baseUrl.includes('signalements')) {
        uploadPath = path.join(uploadsRoot, 'signalements');
      } else if (req.baseUrl.includes('profile')) {
        uploadPath = path.join(uploadsRoot, 'profiles');
      }

      // Créer le dossier s'il n'existe pas
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  });
}

// Filtre des fichiers
const fileFilter = (req, file, cb) => {
  const defaultTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/wav', 'video/mp4'];
  const allowedTypes = process.env.ALLOWED_FILE_TYPES ? process.env.ALLOWED_FILE_TYPES.split(',').map(t => t.trim()) : defaultTypes;

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté'), false);
  }
};

// Configuration multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    files: parseInt(process.env.MAX_FILE_COUNT) || 5 // Maximum files
  }
});

// Middleware pour gérer les erreurs d'upload
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: 'Fichier trop volumineux. Maximum 10MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Trop de fichiers. Maximum 5 fichiers.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Upload single file
const uploadSingle = (fieldName) => {
  return [upload.single(fieldName), handleUploadError];
};

// Upload multiple files
const uploadMultiple = (fieldName, maxCount = 5) => {
  return [upload.array(fieldName, maxCount), handleUploadError];
};

// Upload fields
const uploadFields = (fields) => {
  return [upload.fields(fields), handleUploadError];
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleUploadError
};
