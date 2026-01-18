// routes/settingsRoutes.js
import express from 'express';
import { getHeroVideo, updateHeroVideo } from '../controllers/settingsController.js';
import { adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/settings/hero-video
 * @desc Get hero video settings
 * @access Public
 */
router.get('/hero-video', getHeroVideo);

/**
 * @route PUT /api/settings/hero-video
 * @desc Update hero video settings
 * @access Private (admin only)
 */
router.put('/hero-video', adminProtect, updateHeroVideo);

export default router;
