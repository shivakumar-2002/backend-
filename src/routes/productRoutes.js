import { Router } from 'express';
import {
  getPublicProducts,
  getPublicProductById,
} from '../controllers/productController.js';

const router = Router();

router.get('/', getPublicProducts);
router.get('/:id', getPublicProductById);

export default router;
