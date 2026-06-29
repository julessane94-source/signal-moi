const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const uploadsRoot = path.resolve(__dirname, '..', '..', 'uploads');

const parseDataImage = (value) => {
  const match = String(value || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64')
  };
};

const storeOptimizedImage = async ({ buffer, originalName = 'image', folder = 'slideshow', uploadedBy = null }) => {
  const id = uuidv4();
  const filename = `${folder}-${id}.webp`;
  const relativePath = `uploads/${folder}/${filename}`;
  const absoluteDir = path.join(uploadsRoot, folder);
  const absolutePath = path.join(absoluteDir, filename);

  await fs.promises.mkdir(absoluteDir, { recursive: true });

  const optimizedBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 1000, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78, effort: 4 })
    .toBuffer();

  await fs.promises.writeFile(absolutePath, optimizedBuffer);

  await db.query(
    `INSERT INTO signal_moi.fichiers
      (id, signalement_id, nom_fichier, chemin, type, taille, mime_type, description, is_verified, uploaded_by, file_data, created_at, updated_at)
     VALUES ($1, NULL, $2, $3, 'image', $4, 'image/webp', $5, true, $6, $7, NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    [id, originalName, relativePath, optimizedBuffer.length, `Image ${folder}`, uploadedBy, optimizedBuffer]
  ).catch((err) => {
    console.warn('[imageStorage] Image sauvegardee localement, mais pas en BD:', err.message);
  });

  return `/${relativePath}`;
};

const persistHomePageImages = async (homePage = {}, options = {}) => {
  const images = Array.isArray(homePage.images) ? homePage.images.filter(Boolean) : [];
  let changed = false;

  const nextImages = await Promise.all(images.map(async (image, index) => {
    if (typeof image !== 'string' || !image.startsWith('data:image/')) return image;
    const parsed = parseDataImage(image);
    if (!parsed) return image;
    changed = true;
    return storeOptimizedImage({
      buffer: parsed.buffer,
      originalName: `slideshow-${index + 1}.webp`,
      folder: 'slideshow',
      uploadedBy: options.uploadedBy || null
    });
  }));

  return {
    changed,
    homePage: {
      ...homePage,
      images: nextImages
    }
  };
};

module.exports = {
  parseDataImage,
  persistHomePageImages,
  storeOptimizedImage
};
