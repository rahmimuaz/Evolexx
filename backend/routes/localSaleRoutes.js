import express from 'express';
import {
  createLocalSale,
  getLocalSales,
  getLocalSaleById,
  deleteLocalSale
} from '../controllers/localSaleController.js';
import { adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for viewing invoice via QR code
router.get('/:id', getLocalSaleById);

// Admin routes
router.post('/', adminProtect, createLocalSale);
router.get('/', adminProtect, getLocalSales);
router.delete('/:id', adminProtect, deleteLocalSale);

export default router;
