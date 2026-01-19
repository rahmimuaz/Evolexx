import LocalSale from '../models/LocalSale.js';
import Product from '../models/Product.js';
import asyncHandler from 'express-async-handler';
import QRCode from 'qrcode';

// @desc    Create a new local sale
// @route   POST /api/local-sales
// @access  Private/Admin
export const createLocalSale = asyncHandler(async (req, res) => {
  const { customerName, customerPhone, customerEmail, customerAddress, items, subtotal, tax, discount, totalAmount, paymentMethod, notes } = req.body;

  if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Missing required fields: customerName, customerPhone, and items are required');
  }

  // Validate items and check stock availability
  const validatedItems = [];
  for (const item of items) {
    if (!item.product || !item.quantity || !item.unitPrice) {
      res.status(400);
      throw new Error('Each item must have product, quantity, and unitPrice');
    }

    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.product}`);
    }

    // Check stock availability
    let availableStock = product.stock;
    if (item.selectedVariation && product.hasVariations && product.variations) {
      // Find matching variation
      const variationIndex = product.variations.findIndex(v => {
        if (!v.attributes) return false;
        const vAttrs = v.attributes instanceof Map 
          ? Object.fromEntries(v.attributes.entries())
          : v.attributes;
        const itemAttrs = item.selectedVariation.attributes instanceof Map
          ? Object.fromEntries(item.selectedVariation.attributes.entries())
          : item.selectedVariation.attributes;
        
        return Object.keys(vAttrs).every(key => vAttrs[key] === itemAttrs[key]);
      });
      
      if (variationIndex !== -1) {
        availableStock = product.variations[variationIndex].stock || 0;
      } else {
        res.status(400);
        throw new Error(`Variation not found for product: ${product.name}`);
      }
    }

    if (availableStock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`);
    }

    validatedItems.push({
      product: product._id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
      selectedVariation: item.selectedVariation || null,
    });
  }

  // Create local sale
  const localSale = await LocalSale.create({
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    items: validatedItems,
    subtotal: subtotal || validatedItems.reduce((sum, item) => sum + item.totalPrice, 0),
    tax: tax || 0,
    discount: discount || 0,
    totalAmount: totalAmount || (subtotal || validatedItems.reduce((sum, item) => sum + item.totalPrice, 0)) + (tax || 0) - (discount || 0),
    paymentMethod: paymentMethod || 'cash',
    notes,
    createdBy: req.admin._id,
  });

  // Deduct stock from inventory
  for (const item of validatedItems) {
    const product = await Product.findById(item.product);
    
    if (item.selectedVariation && product.hasVariations && product.variations) {
      // Update variation stock
      const variationIndex = product.variations.findIndex(v => {
        if (!v.attributes) return false;
        const vAttrs = v.attributes instanceof Map 
          ? Object.fromEntries(v.attributes.entries())
          : v.attributes;
        const itemAttrs = item.selectedVariation.attributes instanceof Map
          ? Object.fromEntries(item.selectedVariation.attributes.entries())
          : item.selectedVariation.attributes;
        
        return Object.keys(vAttrs).every(key => vAttrs[key] === itemAttrs[key]);
      });
      
      if (variationIndex !== -1) {
        product.variations[variationIndex].stock -= item.quantity;
        // Recalculate total stock
        product.stock = product.variations.reduce((sum, v) => sum + (v.stock || 0), 0);
        await product.save();
      }
    } else {
      // Regular product stock update
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
    }
  }

  // Generate QR code for invoice viewing
  const invoiceUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/invoice/${localSale._id}`;
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(invoiceUrl);
    localSale.qrCodeUrl = qrCodeDataUrl;
    await localSale.save();
  } catch (error) {
    // QR code generation failed, but don't fail the sale
  }

  // Populate product details for response
  const populatedSale = await LocalSale.findById(localSale._id)
    .populate('items.product', 'name images')
    .populate('createdBy', 'email')
    .lean();

  res.status(201).json(populatedSale);
});

// @desc    Get all local sales
// @route   GET /api/local-sales
// @access  Private/Admin
export const getLocalSales = asyncHandler(async (req, res) => {
  const localSales = await LocalSale.find()
    .populate('items.product', 'name images')
    .populate('createdBy', 'email')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(localSales);
});

// @desc    Get local sale by ID
// @route   GET /api/local-sales/:id
// @access  Public (for invoice viewing via QR code)
export const getLocalSaleById = asyncHandler(async (req, res) => {
  const localSale = await LocalSale.findById(req.params.id)
    .populate('items.product', 'name images category')
    .populate('createdBy', 'email')
    .lean();

  if (!localSale) {
    res.status(404);
    throw new Error('Local sale not found');
  }

  res.status(200).json(localSale);
});

// @desc    Delete local sale
// @route   DELETE /api/local-sales/:id
// @access  Private/Admin
export const deleteLocalSale = asyncHandler(async (req, res) => {
  const localSale = await LocalSale.findById(req.params.id);

  if (!localSale) {
    res.status(404);
    throw new Error('Local sale not found');
  }

  // Restore stock (optional - you might not want to restore stock on deletion)
  // This is commented out - uncomment if you want to restore stock when deleting a sale
  /*
  for (const item of localSale.items) {
    const product = await Product.findById(item.product);
    if (product) {
      if (item.selectedVariation && product.hasVariations && product.variations) {
        const variationIndex = product.variations.findIndex(v => {
          // Match variation logic
        });
        if (variationIndex !== -1) {
          product.variations[variationIndex].stock += item.quantity;
          product.stock = product.variations.reduce((sum, v) => sum + (v.stock || 0), 0);
          await product.save();
        }
      } else {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { new: true }
        );
      }
    }
  }
  */

  await LocalSale.findByIdAndDelete(req.params.id);

  res.status(200).json({ message: 'Local sale deleted successfully' });
});
