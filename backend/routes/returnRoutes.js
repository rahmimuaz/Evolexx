import express from 'express';
import {
  createReturnRequest,
  getMyReturns,
  getReturnById,
  getAdminReturns,
  updateReturnStatus,
} from '../controllers/returnController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Client routes - require user auth (not admin)
router.post('/', protect, createReturnRequest);
router.get('/my', protect, getMyReturns);
router.get('/:id', protect, getReturnById);

// Admin routes
router.get('/admin/list', protect, admin, getAdminReturns);
router.patch('/admin/:id/status', protect, admin, updateReturnStatus);

export default router;
