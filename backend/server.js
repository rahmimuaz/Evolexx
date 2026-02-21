import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import upload from './middleware/upload.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import productRoutes from './routes/productRoutes.js';
import toBeShippedRoutes from './routes/toBeShippedRoutes.js'; // <--- NEW: Import the ToBeShipped routes
import settingsRoutes from './routes/settingsRoutes.js'; // Import settings routes
import localSaleRoutes from './routes/localSaleRoutes.js';
import returnRoutes from './routes/returnRoutes.js'; // Import local sales routes
import { generateSitemap } from './controllers/sitemapController.js';


dotenv.config();

const requiredEnvVars = ['MONGODB_URI', 'PORT', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Browser cache headers for API responses
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();

  const path = req.path;

  // No caching for private/user-specific data
  if (path.startsWith('/api/users') || path.startsWith('/api/orders') || path.startsWith('/api/tobeshipped') || path.startsWith('/api/returns') || path.startsWith('/api/admin') || path.startsWith('/api/upload') || path.startsWith('/api/local-sales')) {
    res.set('Cache-Control', 'no-store');
    return next();
  }

  // 5 min cache for settings (rarely changes)
  if (path.startsWith('/api/settings')) {
    res.set('Cache-Control', 'public, max-age=300');
    return next();
  }

  // 1 min cache for search results
  if (path === '/api/products/search') {
    res.set('Cache-Control', 'public, max-age=60');
    return next();
  }

  // 2 min cache for product data
  if (path.startsWith('/api/products')) {
    res.set('Cache-Control', 'public, max-age=120');
    return next();
  }

  next();
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

app.get('/sitemap.xml', generateSitemap);

app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/tobeshipped', toBeShippedRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/local-sales', localSaleRoutes);
app.use('/api/returns', returnRoutes);




app.get('/api/test-cloudinary', async (req, res) => {
  try {
    const cloudinary = (await import('./config/cloudinary.js')).default;
    const result = await cloudinary.api.ping();
    res.json({
      message: 'Cloudinary connection successful',
      result: result
    });
  } catch (error) {
    res.status(500).json({
      message: 'Cloudinary connection failed',
      error: error.message
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack
  });

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum is 5 files.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field.' });
    }
    return res.status(400).json({ message: 'File upload error: ' + err.message });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation error: ' + err.message });
  }

  if (err.message && err.message.includes('Only image and PDF files are allowed')) {
    return res.status(400).json({ message: err.message });
  }

  // Auth errors (expired token, invalid token, not authorized) - return 401
  const isAuthError =
    err.message?.includes('Not authorized') ||
    err.message?.includes('session') ||
    err.message?.includes('expired') ||
    err.message?.includes('token') ||
    err.message?.includes('log in again');
  if (isAuthError) {
    return res.status(401).json({
      message: err.message || 'Session expired. Please log in again.',
    });
  }

  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined // Only show full error in development
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});