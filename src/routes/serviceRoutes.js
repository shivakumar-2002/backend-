import { Router } from 'express';
import { getPublicServices } from '../controllers/serviceController.js';

const router = Router();

router.get('/', getPublicServices);

export default router;
