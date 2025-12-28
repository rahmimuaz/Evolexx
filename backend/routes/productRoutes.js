import express from 'express';
import upload from '../middleware/upload.js';
import {
  getProducts,
  getProduct,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  addReview,
  getReviews,
  getLowStockProducts,
  getOutOfStockProducts,
  searchProducts,
  getNewArrivals,
  toggleNewArrival,
  updateNewArrivalsOrder,
  updateProductsOrder,
  getProductsSorted
} from '../controllers/productController.js';

import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// ============== STATIC ROUTES (must come before dynamic :id routes) ==============

// Create a new product with image upload (Cloudinary)
router.post('/', upload.array('images', 5), createProduct);

// Get all products
router.get('/', getProducts);

// Product search (by name)
router.get('/search', searchProducts);

// Get products sorted by display order
router.get('/sorted', getProductsSorted);

// Update products display order (admin)
router.put('/order', updateProductsOrder);

// Get products by category
router.get('/category/:category', getProductsByCategory);

// Get a single product by slug (SEO-friendly URL)
router.get('/p/:slug', getProductBySlug);

// Admin routes
router.get('/admin/low-stock', getLowStockProducts);
router.get('/admin/out-of-stock', getOutOfStockProducts);

// ============== NEW ARRIVALS ROUTES ==============
// Get all new arrival products (public)
router.get('/new-arrivals', getNewArrivals);
// Update new arrivals order (admin)
router.put('/new-arrivals/order', updateNewArrivalsOrder);

// ============== DYNAMIC :id ROUTES ==============

// Get a single product by ID (legacy support)
router.get('/:id', getProduct);

// Update a product (with optional image upload)
router.put('/:id', upload.array('images', 5), updateProduct);

// Delete a product and its images
router.delete('/:id', deleteProduct);

// Toggle product as new arrival (admin)
router.patch('/:id/toggle-new-arrival', toggleNewArrival);

// Add a review to a product (by ID)
router.post('/:id/reviews', protect, addReview);

// Get all reviews for a product (by ID)
router.get('/:id/reviews', getReviews);

export default router;

