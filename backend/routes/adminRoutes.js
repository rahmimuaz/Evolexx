// routes/adminRoutes.js
import express from 'express';
import { loginAdmin, registerAdmin } from '../controllers/adminController.js'; // Import both controllers

const router = express.Router();

/**
 * @route POST /api/admin/login
 * @desc Authenticate admin and get token
 * @access Public
 */
router.post('/login', loginAdmin);

/**
 * @route POST /api/admin/register
 * @desc Register a new admin account
 * @access Public
 */
router.post('/register', registerAdmin);

// You can add more admin-specific routes here, e.g.:
// router.get('/dashboard-stats', protect, adminMiddleware, getDashboardStats);
// where 'protect' is a middleware to verify JWT and 'adminMiddleware' checks user role.

export default router;
