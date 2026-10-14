import { uploadImageToStorage, deleteImageFromStorage } from '../config/cloudinary.js';

export const uploadImages = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded.',
      });
    }

    const uploadPromises = files.map((file) => uploadImageToStorage(file));
    const results = await Promise.all(uploadPromises);

    const formatted = results.map((r, idx) => ({
      imageUrl: r.imageUrl,
      publicId: r.publicId,
      originalName: files[idx].originalname,
    }));

    return res.status(200).json({
      success: true,
      message: 'Image(s) uploaded successfully.',
      images: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Image identifier (publicId) is required.',
      });
    }

    await deleteImageFromStorage(id);

    return res.status(200).json({
      success: true,
      message: 'Image removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};
