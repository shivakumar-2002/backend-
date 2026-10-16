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

// Local storage fallback setup (wrapped in try-catch for serverless environments)
const uploadsDir = path.resolve(__dirname, '../../public/uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  // Gracefully ignored on read-only serverless platforms like Vercel
  console.warn('Local uploads directory not writable or running in serverless environment:', err.message);
}

// Multer memory storage - works seamlessly across local, VPS, Docker, and Serverless (Vercel)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();
    if (allowed.test(ext) || mime.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Only valid image files (JPG, PNG, WEBP, GIF) are allowed.'));
  },
});

export const uploadImageToStorage = async (file) => {
  // 1. Primary: Cloudinary Cloud CDN if credentials exist
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

  // 2. Secondary: Local disk storage if filesystem is writable
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = (path.extname(file.originalname) || '.png').toLowerCase();
    const filename = `jewel-${uniqueSuffix}${ext}`;
    const filePath = path.resolve(uploadsDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    return {
      imageUrl: `/uploads/${filename}`,
      publicId: filename,
    };
  } catch (fsErr) {
    // 3. Fallback for serverless read-only filesystems (e.g. Vercel without Cloudinary)
    console.warn('⚠️ Serverless or read-only filesystem detected. Storing image as data URI in DB:', fsErr.message);
    const mime = file.mimetype || 'image/png';
    const base64Data = file.buffer.toString('base64');
    const dataUri = `data:${mime};base64,${base64Data}`;

    return {
      imageUrl: dataUri,
      publicId: `data-uri-${Date.now()}`,
    };
  }
};

export const deleteImageFromStorage = async (publicId) => {
  if (!publicId || publicId.startsWith('data-uri-')) return;

  if (isCloudinaryConfigured && !publicId.startsWith('jewel-')) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('Failed to delete image from Cloudinary:', err);
    }
  } else {
    // Local deletion
    try {
      const localPath = path.resolve(uploadsDir, publicId);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (err) {
      console.error('Failed to delete local image:', err);
    }
  }
};

export { cloudinary, isCloudinaryConfigured };
