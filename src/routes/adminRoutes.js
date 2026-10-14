import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

// Controllers
import {
  getAdminProducts,
  getAdminProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
} from '../controllers/productController.js';

import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';

import {
  getAdminEnquiries,
  getAdminEnquiryById,
  updateEnquiryStatus,
  updateEnquiryNotes,
} from '../controllers/enquiryController.js';

import {
  getAdminShopSettings,
  updateShopSettings,
} from '../controllers/settingsController.js';

import {
  getAdminServices,
  createService,
  updateService,
  deleteService,
  updateServiceStatus,
} from '../controllers/serviceController.js';

import { getDashboardStats } from '../controllers/dashboardController.js';
import { uploadImages, deleteImage } from '../controllers/uploadController.js';

const router = Router();

// Protect ALL admin routes with requireAdmin middleware
router.use(requireAdmin);

// Dashboard Statistics
router.get('/stats', getDashboardStats);

// Product Management
router.get('/products', getAdminProducts);
router.post('/products', createProduct);
router.get('/products/:id', getAdminProductById);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.patch('/products/:id/status', updateProductStatus);

// Category Management
router.get('/categories', getAdminCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Image Uploads (Multi-part)
router.post('/upload', upload.array('images', 10), uploadImages);
router.delete('/images/:id', deleteImage);

// Enquiry Management
router.get('/enquiries', getAdminEnquiries);
router.get('/enquiries/:id', getAdminEnquiryById);
router.patch('/enquiries/:id/status', updateEnquiryStatus);
router.patch('/enquiries/:id/notes', updateEnquiryNotes);

// Shop Settings Management
router.get('/shop-settings', getAdminShopSettings);
router.put('/shop-settings', updateShopSettings);

// Services Management
router.get('/services', getAdminServices);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);
router.patch('/services/:id/status', updateServiceStatus);

export default router;
