import { Router } from 'express';
import {
  getPublicCategories,
  getCategoryProducts,
} from '../controllers/categoryController.js';

const router = Router();

router.get('/', getPublicCategories);
router.get('/:slug/products', getCategoryProducts);

export default router;
