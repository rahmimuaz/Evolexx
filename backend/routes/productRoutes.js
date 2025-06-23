import express from 'express';
import upload from '../middleware/upload.js';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
} from '../controller/productController.js';

const router = express.Router();

// Create a new product with image upload (Cloudinary)
router.post('/', upload.array('images', 5), createProduct);

// Get all products
router.get('/', getProducts);

// Get products by category — must come BEFORE getProduct('/:id') route
router.get('/category/:category', getProductsByCategory);

// Get a single product by ID
router.get('/:id', getProduct);

// Update a product (with optional image upload)
router.put('/:id', upload.array('images', 5), updateProduct);

// Delete a product and its images
router.delete('/:id', deleteProduct);

export default router;
