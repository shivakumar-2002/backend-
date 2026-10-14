import { Router } from 'express';
import { getPublicShopSettings } from '../controllers/settingsController.js';

const router = Router();

router.get('/', getPublicShopSettings);

export default router;
