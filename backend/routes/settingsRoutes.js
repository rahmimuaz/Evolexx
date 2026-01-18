// routes/settingsRoutes.js
import express from 'express';
import { getHeroVideo, updateHeroVideo } from '../controllers/settingsController.js';
import { adminProtect } from '../middleware/authMiddleware.js';
import uploadVideo from '../middleware/uploadVideo.js';

const router = express.Router();

/**
 * @route GET /api/settings/hero-video
 * @desc Get hero video settings
 * @access Public
 */
router.get('/hero-video', getHeroVideo);

/**
 * @route PUT /api/settings/hero-video
 * @desc Update hero video settings (supports file uploads to Cloudinary)
 * @access Private (admin only)
 */
router.put('/hero-video', adminProtect, uploadVideo.fields([
  { name: 'desktopVideo', maxCount: 1 },
  { name: 'desktopWebm', maxCount: 1 },
  { name: 'mobileVideo', maxCount: 1 },
  { name: 'mobileWebm', maxCount: 1 }
]), updateHeroVideo);

export default router;
