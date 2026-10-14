import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Local storage fallback setup
const uploadsDir = path.resolve(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer memory or disk storage
const storage = isCloudinaryConfigured
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `jewel-${uniqueSuffix}${ext}`);
      },
    });

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();
    if (allowed.test(ext) && (mime.startsWith('image/'))) {
      return cb(null, true);
    }
    cb(new Error('Only valid image files (JPG, PNG, WEBP, GIF) are allowed.'));
  },
});

export const uploadImageToStorage = async (file) => {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const folder = process.env.CLOUDINARY_FOLDER || 'harihara_jewellery';
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            imageUrl: result.secure_url,
            publicId: result.public_id,
          });
        }
      );
      uploadStream.end(file.buffer);
    });
  }

  // Local fallback
  return {
    imageUrl: `/uploads/${file.filename}`,
    publicId: file.filename,
  };
};

export const deleteImageFromStorage = async (publicId) => {
  if (!publicId) return;

  if (isCloudinaryConfigured && !publicId.startsWith('jewel-')) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('Failed to delete image from Cloudinary:', err);
    }
  } else {
    // Local deletion
    const localPath = path.resolve(uploadsDir, publicId);
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
      } catch (err) {
        console.error('Failed to delete local image:', err);
      }
    }
  }
};

export { cloudinary, isCloudinaryConfigured };
