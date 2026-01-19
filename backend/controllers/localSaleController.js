import LocalSale from '../models/LocalSale.js';
import Product from '../models/Product.js';
import asyncHandler from 'express-async-handler';
import QRCode from 'qrcode';

export const createLocalSale = asyncHandler(async (req, res) => {
  const { customerName, customerPhone, customerEmail, customerAddress, items, subtotal, tax, discount, totalAmount, paymentMethod, notes } = req.body;

  if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Missing required fields: customerName, customerPhone, and items are required');
  }

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

    let availableStock = product.stock;
    if (item.selectedVariation && product.hasVariations && product.variations) {
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

  for (const item of validatedItems) {
    const product = await Product.findById(item.product);
    
    if (item.selectedVariation && product.hasVariations && product.variations) {
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
        product.stock = product.variations.reduce((sum, v) => sum + (v.stock || 0), 0);
        await product.save();
      }
    } else {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
    }
  }

  const invoiceUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/invoice/${localSale._id}`;
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(invoiceUrl);
    localSale.qrCodeUrl = qrCodeDataUrl;
    await localSale.save();
  } catch (error) {
  }

  const populatedSale = await LocalSale.findById(localSale._id)
    .populate('items.product', 'name images')
    .populate('createdBy', 'email')
    .lean();

  res.status(201).json(populatedSale);
});

export const getLocalSales = asyncHandler(async (req, res) => {
  const localSales = await LocalSale.find()
    .populate('items.product', 'name images')
    .populate('createdBy', 'email')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(localSales);
});

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

export const deleteLocalSale = asyncHandler(async (req, res) => {
  const localSale = await LocalSale.findById(req.params.id);

  if (!localSale) {
    res.status(404);
    throw new Error('Local sale not found');
  }

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
