// backend/controllers/productController.js

import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';
import userModel from '../models/userModel.js'; // Ensure this matches your User model file name and export
import mongoose from 'mongoose';

// Helper function to convert MongoDB Map to plain object for JSON serialization
const mapToObject = (map) => {
  if (!map) return {};
  
  // If it's already a plain object, return as is
  if (typeof map === 'object' && map.constructor === Object && !(map instanceof Map)) {
    return map;
  }
  
  // If it's a Map, convert it
  if (map instanceof Map) {
    const obj = {};
    for (const [key, value] of map.entries()) {
      obj[key] = value;
    }
    return obj;
  }
  
  // If it has Map-like methods but isn't a Map instance (Mongoose subdocument)
  if (map && typeof map.get === 'function' && typeof map.set === 'function') {
    const obj = {};
    try {
      // Try to iterate using forEach if available
      if (typeof map.forEach === 'function') {
        map.forEach((value, key) => {
          obj[key] = value;
        });
      } else {
        // Fallback: try to access keys directly if it's an object
        Object.keys(map).forEach(key => {
          obj[key] = map[key];
        });
      }
    } catch (e) {
      console.error('Error converting Map to object:', e);
      return {};
    }
    return obj;
  }
  
  // Last resort: try as plain object
  return typeof map === 'object' ? map : {};
};

// Helper function to serialize product variations for JSON response
const serializeProduct = (product) => {
  if (!product) return product;
  
  // Use lean() alternative or toObject with proper options
  const productObj = product.toObject ? product.toObject({ virtuals: true, flattenMaps: false }) : product;
  
  // Convert variations Map to plain objects
  if (productObj.variations && Array.isArray(productObj.variations)) {
    productObj.variations = productObj.variations.map(variation => {
      // Handle attributes - could be Map, Object, or already converted
      let attributesObj = {};
      
      if (variation.attributes) {
        if (variation.attributes instanceof Map) {
          // Convert Map to object
          attributesObj = mapToObject(variation.attributes);
        } else if (typeof variation.attributes === 'object' && variation.attributes.constructor === Object) {
          // Already an object, use as is
          attributesObj = variation.attributes;
        } else if (variation.attributes.get && typeof variation.attributes.get === 'function') {
          // It's a Map-like object, convert it
          attributesObj = mapToObject(variation.attributes);
        }
      }
      
      return {
        ...variation,
        attributes: attributesObj
      };
    });
  }
  
  return productObj;
};


// Get all products (sorted by displayOrder, then by createdAt)
export const getProducts = async (req, res) => {
  try {
    // Use lean() to get plain JavaScript objects
    const products = await Product.find({}).sort({ displayOrder: 1, createdAt: -1 }).lean();
    
    // Convert variations Map to plain objects for all products
    const serializedProducts = products.map(product => {
      if (product.variations && Array.isArray(product.variations)) {
        product.variations = product.variations.map(variation => {
          if (variation.attributes) {
            let attributesObj = {};
            if (variation.attributes instanceof Map) {
              attributesObj = mapToObject(variation.attributes);
            } else if (typeof variation.attributes === 'object') {
              attributesObj = {};
              Object.keys(variation.attributes).forEach(key => {
                attributesObj[key] = variation.attributes[key];
              });
            }
            return {
              ...variation,
              attributes: attributesObj
            };
          }
          return variation;
        });
      }
      return product;
    });
    
    res.status(200).json(serializedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Get single product by ID
export const getProduct = async (req, res) => {
  try {
    // Validate ObjectId to avoid Cast errors when non-id strings are passed (e.g., '/products/sorted')
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Use lean() to get plain JavaScript object (avoids Map conversion issues)
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Convert variations Map to plain objects manually
    if (product.variations && Array.isArray(product.variations)) {
      product.variations = product.variations.map(variation => {
        if (variation.attributes) {
          let attributesObj = {};
          if (variation.attributes instanceof Map) {
            attributesObj = mapToObject(variation.attributes);
          } else if (typeof variation.attributes === 'object') {
            attributesObj = {};
            Object.keys(variation.attributes).forEach(key => {
              attributesObj[key] = variation.attributes[key];
            });
          }
          return {
            ...variation,
            attributes: attributesObj
          };
        }
        return variation;
      });
    }
    
    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Get single product by slug (SEO-friendly URL)
export const getProductBySlug = async (req, res) => {
  try {
    // Use lean() to get plain JavaScript object (avoids Map conversion issues)
    const product = await Product.findOne({ slug: req.params.slug }).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Convert variations Map to plain objects manually
    if (product.variations && Array.isArray(product.variations)) {
      product.variations = product.variations.map(variation => {
        if (variation.attributes) {
          // When using lean(), Map types are already converted, but check to be sure
          let attributesObj = {};
          
          if (variation.attributes instanceof Map) {
            attributesObj = mapToObject(variation.attributes);
          } else if (typeof variation.attributes === 'object') {
            // Should already be an object with lean(), but ensure all keys are accessible
            attributesObj = {};
            Object.keys(variation.attributes).forEach(key => {
              attributesObj[key] = variation.attributes[key];
            });
          }
          
          return {
            ...variation,
            attributes: attributesObj
          };
        }
        return variation;
      });
    }
    
    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const { name, category, price, description, longDescription, stock, details, warrantyPeriod, discountPrice, kokoPay, variants, hasVariants, variations, hasVariations } = req.body;

    let images = [];
    let parsedVariants = [];
    let parsedVariations = [];

    // Handle new flexible variations system
    if (hasVariations === 'true' || hasVariations === true) {
      try {
        parsedVariations = typeof variations === 'string' ? JSON.parse(variations) : variations;
        
        if (!Array.isArray(parsedVariations) || parsedVariations.length === 0) {
          return res.status(400).json({ message: 'Product with variations must have at least one variation.' });
        }

        // Validate each variation
        for (const variation of parsedVariations) {
          if (!variation.attributes || Object.keys(variation.attributes).length === 0) {
            return res.status(400).json({ message: 'Each variation must have at least one attribute (e.g., storage, color).' });
          }
          if (variation.stock === undefined || variation.stock === null) {
            return res.status(400).json({ message: 'Each variation must have a stock value.' });
          }
        }
        
        // Extract main product images (fieldname === 'images')
        const mainImageFiles = req.files ? req.files.filter(file => file.fieldname === 'images') : [];
        if (mainImageFiles.length > 0) {
          images = mainImageFiles.map(file => file.path);
        } else if (req.body.images) {
          images = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
        } else if (parsedVariations[0]?.images && parsedVariations[0].images.length > 0) {
          images = parsedVariations[0].images;
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid JSON format for variations: ' + err.message });
      }
    } 
    // Handle legacy color variants if present
    else if (hasVariants === 'true' && variants) {
      try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        
        // Use images from the request body (already uploaded)
        if (req.body.images) {
          images = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid JSON format for variants.' });
      }
    } 
      // Traditional product with no variants
    else {
      // Filter main product images (fieldname === 'images')
      const mainImageFiles = req.files ? req.files.filter(file => file.fieldname === 'images') : [];
      
      if (mainImageFiles.length === 0) {
        return res.status(400).json({ message: 'Product must have at least one image.' });
      }

      if (mainImageFiles.length > 5) {
        return res.status(400).json({ message: 'Product cannot have more than 5 images.' });
      }

      // Extract image paths (Cloudinary URLs) from uploaded files
      images = mainImageFiles.map(file => file.path);
    }

    // Validate essential fields
    // For products with variations, stock is calculated from variations
    if (!name || !category || !price || !description) {
      return res.status(400).json({
        message: 'Missing required fields: name, category, price, and description are required.'
      });
    }

    // Stock validation: required only if no variations
    if (!hasVariations && (stock === undefined || stock === null)) {
      return res.status(400).json({
        message: 'Stock is required for products without variations.'
      });
    }

    // Parse details if provided (handle stringified JSON or direct object)
    let parsedDetails = {};
    if (details) {
      try {
        parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
      } catch (err) {
        return res.status(400).json({ message: 'Invalid JSON format for product details.' });
      }
    }

    // Validate category-specific details (as per your Product.js schema)
    // Main categories (Electronics, Mobile Accessories, Pre-owned Devices, Other) don't require specific fields
    // Only subcategories have required fields
    const requiredCategoryFields = {
      'Mobile Phone': ['brand', 'model', 'storage', 'ram', 'color', 'screenSize', 'batteryCapacity', 'processor', 'camera', 'operatingSystem'],
      'Preowned Phones': ['brand', 'model', 'condition', 'storage', 'ram', 'color', 'batteryHealth', 'warranty'],
      'Laptops': ['brand', 'model', 'processor', 'ram', 'storage', 'display', 'graphics', 'operatingSystem'],
      'Chargers': ['brand', 'type', 'wattage', 'compatibility', 'color', 'cableLength', 'material'],
      'Smartwatches': ['brand', 'model', 'screenType', 'caseMaterial', 'waterResistance', 'batteryLife', 'operatingSystem'],
      'Phone Covers': ['brand', 'type', 'compatibility', 'color', 'material'],
      'Screen Protectors': ['brand', 'type', 'compatibility', 'features', 'material'],
      'Cables': ['brand', 'type', 'length', 'compatibility', 'color', 'material'],
      'Headphones': ['brand', 'model', 'type', 'connectivity', 'noiseCancellation', 'batteryLife', 'color', 'driverSize'],
      'Earbuds': ['brand', 'model', 'type', 'connectivity', 'noiseCancellation', 'batteryLife', 'color', 'waterResistance'],
      'Other Accessories': ['brand', 'type', 'compatibility', 'color', 'material']
    };

    const categoryFields = requiredCategoryFields[category];
    if (categoryFields) {
      const missingFields = categoryFields.filter(field => !parsedDetails[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          message: `Missing required details for ${category}: ${missingFields.join(', ')}`
        });
      }
    }

    // Calculate total stock from variations if product has variations
    let totalStock = 0;
    if (hasVariations && parsedVariations.length > 0) {
      totalStock = parsedVariations.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
    } else {
      totalStock = parseInt(stock) || 0;
    }

    // Process variation images if provided
    // Files come as variation-${variationId}-images in req.files array (when using upload.any())
    const variationImageMap = {};
    if (req.files && Array.isArray(req.files)) {
      // Group files by variation ID
      req.files.forEach(file => {
        if (file.fieldname && file.fieldname.startsWith('variation-') && file.fieldname.endsWith('-images')) {
          const variationId = file.fieldname.replace('variation-', '').replace('-images', '');
          if (!variationImageMap[variationId]) {
            variationImageMap[variationId] = [];
          }
          variationImageMap[variationId].push(file.path); // Cloudinary URL
        }
      });
    }

    // Convert variations attributes to Map format for MongoDB
    const formattedVariations = parsedVariations.map(variation => {
      // Get images for this variation if uploaded
      const variationImages = variation._variationId && variationImageMap[variation._variationId]
        ? variationImageMap[variation._variationId]
        : (variation.images || []);
      
      return {
        attributes: new Map(Object.entries(variation.attributes || {})),
        stock: parseInt(variation.stock) || 0,
        price: variation.price ? parseFloat(variation.price) : undefined,
        discountPrice: variation.discountPrice ? parseFloat(variation.discountPrice) : undefined,
        images: variationImages,
        sku: variation.sku || undefined
      };
    });

    const newProduct = new Product({
      name,
      category,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined, // Optional
      description,
      longDescription, // Optional
      images,
      stock: totalStock,
      warrantyPeriod: warrantyPeriod || 'No Warranty', // Optional
      details: parsedDetails, // Ensure this is an object
      kokoPay: kokoPay === 'true' || kokoPay === true, // Handle boolean from form-data
      hasVariations: hasVariations === 'true' || hasVariations === true,
      variations: formattedVariations.length > 0 ? formattedVariations : undefined,
      variants: parsedVariants.length > 0 ? parsedVariants : undefined
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(serializeProduct(savedProduct));

  } catch (error) {
    console.error('Error creating product:', error);

    // Mongoose validation error for required fields or types
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation error',
        errors: validationErrors
      });
    }
    // Handle duplicate ID if 'productId' was manually set and is not unique
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'A product with this ID already exists. Please try again.'
      });
    }

    res.status(500).json({
      message: 'Failed to create product. Please check the provided data.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined // Show detailed error in dev
    });
  }
};

// Update an existing product
export const updateProduct = async (req, res) => {
  try {
    const { name, category, price, description, longDescription, stock, details, warrantyPeriod, discountPrice, kokoPay, variations, hasVariations } = req.body;

    const productToUpdate = await Product.findById(req.params.id);
    if (!productToUpdate) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let parsedDetails = {};
    if (details) {
      try {
        parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
      } catch (e) {
        return res.status(400).json({ message: 'Invalid JSON format for product details.' });
      }
    }

    // Handle existing images and new uploads
    let existingImages = [];
    if (req.body.existingImages) {
      try {
        existingImages = JSON.parse(req.body.existingImages); // Assume it comes as a stringified array
      } catch (e) {
        existingImages = Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages]; // Fallback for single image or malformed string
      }
      existingImages = existingImages.filter(Boolean); // Remove any null/undefined/empty strings
    }

    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map(file => file.path); // Cloudinary URLs from multer
    }

    const updatedImages = [...existingImages, ...newImages];
    
    console.log('Update Product - Existing images from DB:', productToUpdate.images);
    console.log('Update Product - Existing images from request:', existingImages);
    console.log('Update Product - New images:', newImages);
    console.log('Update Product - Final updated images:', updatedImages);

    // Image validation after combining
    if (updatedImages.length === 0 || updatedImages.length > 5) {
      // If no new files and no existing images are kept
      if (updatedImages.length === 0) {
        return res.status(400).json({ message: 'Product must have at least one image.' });
      }
      // If too many images after combining
      if (updatedImages.length > 5) {
        // You might want to prune new images if total exceeds 5, or just error
        return res.status(400).json({ message: 'Product cannot have more than 5 images.' });
      }
    }

    // Find images that were removed from the product and delete them from Cloudinary
    // Normalize URLs for comparison (remove trailing slashes, query params, normalize encoding)
    const normalizeUrl = (url) => {
      if (!url) return '';
      try {
        // Remove query parameters and fragments for comparison
        const urlObj = new URL(url.trim());
        return `${urlObj.origin}${urlObj.pathname}`.replace(/\/$/, '');
      } catch (e) {
        // If URL parsing fails, just trim and remove trailing slash
        return url.trim().replace(/\/$/, '').split('?')[0].split('#')[0];
      }
    };
    
    const normalizedUpdatedImages = updatedImages.map(normalizeUrl);
    const imagesToDeleteFromCloudinary = productToUpdate.images.filter(
      (img) => {
        const normalizedImg = normalizeUrl(img);
        const isIncluded = normalizedUpdatedImages.includes(normalizedImg);
        const shouldDelete = img.startsWith('http') && !isIncluded;
        
        if (shouldDelete) {
          console.log(`Image marked for deletion: ${img} (normalized: ${normalizedImg})`);
        }
        
        return shouldDelete;
      }
    );
    
    console.log('Images to delete from Cloudinary:', imagesToDeleteFromCloudinary);

    if (imagesToDeleteFromCloudinary.length > 0) {
      const deletePromises = imagesToDeleteFromCloudinary.map(async (imageUrl) => {
        try {
          // Extract public_id from Cloudinary URL (e.g., https://res.cloudinary.com/xyz/image/upload/v123/products/abc.jpg -> products/abc)
          const urlParts = imageUrl.split('/');
          const filenameWithExtension = urlParts[urlParts.length - 1];
          const filename = filenameWithExtension.split('.')[0];
          const publicId = `products/${filename}`; // Assuming 'products/' is your Cloudinary upload folder
          await cloudinary.uploader.destroy(publicId);
          console.log(`Cloudinary: Successfully deleted ${publicId}`);
        } catch (cloudinaryError) {
          console.error(`Cloudinary: Failed to delete image ${imageUrl}. Error: ${cloudinaryError.message}`);
        }
      });
      await Promise.all(deletePromises);
    }

    // Handle variations if provided
    let parsedVariations = [];
    let totalStock = parseInt(stock) || 0;
    let formattedVariations = undefined;

    // Process variation images if provided
    const variationImageMap = {};
    if (req.files && Array.isArray(req.files)) {
      // Group files by variation ID
      req.files.forEach(file => {
        if (file.fieldname && file.fieldname.startsWith('variation-') && file.fieldname.endsWith('-images')) {
          const variationId = file.fieldname.replace('variation-', '').replace('-images', '');
          if (!variationImageMap[variationId]) {
            variationImageMap[variationId] = [];
          }
          variationImageMap[variationId].push(file.path); // Cloudinary URL
        }
      });
    }

    if (hasVariations === 'true' || hasVariations === true) {
      try {
        parsedVariations = typeof variations === 'string' ? JSON.parse(variations) : variations;
        
        if (Array.isArray(parsedVariations) && parsedVariations.length > 0) {
          // Validate each variation
          for (const variation of parsedVariations) {
            if (!variation.attributes || Object.keys(variation.attributes).length === 0) {
              return res.status(400).json({ message: 'Each variation must have at least one attribute (e.g., storage, color).' });
            }
            if (variation.stock === undefined || variation.stock === null) {
              return res.status(400).json({ message: 'Each variation must have a stock value.' });
            }
          }

          // Calculate total stock from variations
          totalStock = parsedVariations.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);

          // Convert variations attributes to Map format for MongoDB
          formattedVariations = parsedVariations.map(variation => {
            // Get images for this variation if uploaded, otherwise use existing images
            const variationImages = variation._variationId && variationImageMap[variation._variationId]
              ? variationImageMap[variation._variationId]
              : (variation.images || []);
            
            return {
              attributes: new Map(Object.entries(variation.attributes || {})),
              stock: parseInt(variation.stock) || 0,
              price: variation.price ? parseFloat(variation.price) : undefined,
              discountPrice: variation.discountPrice ? parseFloat(variation.discountPrice) : undefined,
              images: variationImages,
              sku: variation.sku || undefined
            };
          });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid JSON format for variations: ' + err.message });
      }
    }

    const updateData = {
        name,
        category,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
        description,
        longDescription,
        images: updatedImages, // Set the final combined array of images
      stock: totalStock,
        warrantyPeriod,
        details: parsedDetails,
      kokoPay: kokoPay === 'true' || kokoPay === true,
      hasVariations: hasVariations === 'true' || hasVariations === true
    };

    // Only update variations if provided
    if (formattedVariations !== undefined) {
      updateData.variations = formattedVariations;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found after update attempt.' });
    }

    res.status(200).json(serializeProduct(updatedProduct));

  } catch (error) {
    console.error('Error updating product:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation error',
        errors: validationErrors
      });
    }
    res.status(500).json({
      message: 'Failed to update product. Please check the provided data.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete a product and its associated Cloudinary images
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Delete associated images from Cloudinary
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map(async (imageUrl) => {
        if (imageUrl.startsWith('http')) { // Only attempt to delete Cloudinary URLs
          try {
            const urlParts = imageUrl.split('/');
            const filenameWithExtension = urlParts[urlParts.length - 1];
            const filename = filenameWithExtension.split('.')[0];
            const publicId = `products/${filename}`; // Assuming 'products/' is your Cloudinary upload folder
            await cloudinary.uploader.destroy(publicId);
            console.log(`Cloudinary: Successfully deleted ${publicId}`);
          } catch (cloudinaryError) {
            console.error(`Cloudinary: Failed to delete image ${imageUrl}. Error: ${cloudinaryError.message}`);
          }
        }
      });
      await Promise.all(deletePromises);
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Product and associated images deleted successfully.' });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};


// Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    // Serialize variations for JSON response
    const serializedProducts = products.map(product => serializeProduct(product));
    res.status(200).json(serializedProducts);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Add a review to a product
export const addReview = async (req, res) => {
  try {
    // Assuming req.user is set by your authentication middleware and contains _id
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required to add a review.' });
    }

    const { rating, comment } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Check if the user has purchased this product
    const { default: Order } = await import('../models/Order.js');
    const { default: ToBeShipped } = await import('../models/ToBeShipped.js');
    
    const [userOrders, userShippedOrders] = await Promise.all([
      Order.find({ user: req.user._id }).populate('orderItems.product'),
      ToBeShipped.find({ user: req.user._id }).populate('orderItems.product')
    ]);

    const allOrders = [...userOrders, ...userShippedOrders];
    
    // Check if any order contains this product
    const hasPurchased = allOrders.some(order => {
      if (order.orderItems && Array.isArray(order.orderItems)) {
        return order.orderItems.some(item => {
          const itemProductId = item.product?._id || item.product;
          return itemProductId && itemProductId.toString() === productId.toString();
        });
      }
      return false;
    });

    if (!hasPurchased) {
      return res.status(403).json({ message: 'You can only review products you have purchased.' });
    }

    // Check if the user has already reviewed this product
    const alreadyReviewed = product.reviews.find(
      (r) => r.user && r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this product.' });
    }

    const review = {
      user: req.user._id, // User's ObjectId from authentication middleware
      rating: Number(rating), // Ensure rating is a number
      comment,
      date: new Date() // Use `date` field as per your Product schema review subdocument
    };

    product.reviews.push(review);

    // Update product's aggregate review statistics
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();

    // After saving, re-fetch the product to ensure the newly added review's user data is populated.
    // This provides the frontend with the user's 'name' immediately.
    const savedProductWithPopulatedReviews = await Product.findById(productId).populate({
        path: 'reviews.user',
        select: 'name', // Select only the 'name' field from the User model
        model: userModel // Explicitly specify the User model to populate from
    });

    // Find the newly added review from the fully populated product object
    const newReview = savedProductWithPopulatedReviews.reviews.find(
        (r) => r.user && r.user._id.toString() === req.user._id.toString()
    );

    res.status(201).json({ message: 'Review added successfully', review: newReview });

  } catch (error) {
    console.error('Error adding review:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message }); // Mongoose validation errors
    }
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Get all reviews for a product
export const getReviews = async (req, res) => {
  try {
    // Find the product by ID and select only the 'reviews' field, then populate the 'user' field within reviews
    const product = await Product.findById(req.params.id).select('reviews').populate({
      path: 'reviews.user',  // Path to the 'user' field within each review in the 'reviews' array
      select: 'name',        // Select only the 'name' field from the referenced User document
      model: userModel       // Explicitly tell Mongoose to use your userModel for population
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Ensure reviews is an array before sending (it should be, but good for robustness)
    res.status(200).json(Array.isArray(product.reviews) ? product.reviews : []);

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Get products with stock less than 5 but greater than 0
export const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ stock: { $gt: 0, $lt: 5 } });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Get products with stock equal to 0
export const getOutOfStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ stock: 0 });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching out of stock products:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Search products by name (case-insensitive, partial match)
export const searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') {
      return res.status(200).json([]); // Return empty array if query is empty
    }
    // Use regex for case-insensitive partial matching
    const products = await Product.find({
      name: { $regex: query, $options: 'i' }
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// ============== NEW ARRIVALS MANAGEMENT ==============

// Get all new arrival products (sorted by newArrivalOrder)
export const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({ isNewArrival: true })
      .sort({ newArrivalOrder: 1 });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Toggle product as new arrival
export const toggleNewArrival = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Toggle the isNewArrival status
    product.isNewArrival = !product.isNewArrival;
    
    // If adding to new arrivals, set order to end of list
    if (product.isNewArrival) {
      const maxOrder = await Product.findOne({ isNewArrival: true })
        .sort({ newArrivalOrder: -1 })
        .select('newArrivalOrder');
      product.newArrivalOrder = maxOrder ? maxOrder.newArrivalOrder + 1 : 1;
    } else {
      product.newArrivalOrder = 0;
    }

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    console.error('Error toggling new arrival:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Update new arrivals order (bulk update)
export const updateNewArrivalsOrder = async (req, res) => {
  try {
    const { orderedProducts } = req.body; // Array of { id, newArrivalOrder }
    
    if (!Array.isArray(orderedProducts)) {
      return res.status(400).json({ message: 'orderedProducts must be an array' });
    }

    const updatePromises = orderedProducts.map((item, index) => 
      Product.findByIdAndUpdate(item.id, { newArrivalOrder: index + 1 })
    );

    await Promise.all(updatePromises);
    res.status(200).json({ message: 'New arrivals order updated successfully' });
  } catch (error) {
    console.error('Error updating new arrivals order:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// ============== PRODUCT DISPLAY ORDER MANAGEMENT ==============

// Update products display order (bulk update)
export const updateProductsOrder = async (req, res) => {
  try {
    const { orderedProducts } = req.body; // Array of { id, displayOrder }
    
    if (!Array.isArray(orderedProducts)) {
      return res.status(400).json({ message: 'orderedProducts must be an array' });
    }

    const updatePromises = orderedProducts.map((item, index) => 
      Product.findByIdAndUpdate(item.id, { displayOrder: index + 1 })
    );

    await Promise.all(updatePromises);
    res.status(200).json({ message: 'Products order updated successfully' });
  } catch (error) {
    console.error('Error updating products order:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Get all products sorted by display order
export const getProductsSorted = async (req, res) => {
  try {
    const products = await Product.find({})
      .sort({ displayOrder: 1, createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching sorted products:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};