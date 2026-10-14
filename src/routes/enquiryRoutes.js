import { Router } from 'express';
import { createEnquiry } from '../controllers/enquiryController.js';
import { enquiryLimiter } from '../middleware/rateLimiter.js';
import { upload } from '../config/cloudinary.js';

const router = Router();

router.post('/', enquiryLimiter, upload.single('image'), createEnquiry);

export default router;
