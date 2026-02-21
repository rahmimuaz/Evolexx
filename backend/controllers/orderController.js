import Order from '../models/Order.js';
import User from '../models/userModel.js';
import ToBeShipped from '../models/ToBeShipped.js'; // Import the ToBeShipped model
import Product from '../models/Product.js';

import asyncHandler from 'express-async-handler';
import { sendEmail } from '../utils/sendEmail.js';

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
// Helper: Restore inventory when order is declined or deleted
const restoreOrderStock = async (orderItems) => {
  if (!orderItems || !Array.isArray(orderItems)) return;
  for (const item of orderItems) {
    const productId = item.product?._id || item.product;
    if (!productId) continue;
    const product = await Product.findById(productId);
    if (!product) continue;
    const qty = item.quantity || 0;
    if (qty <= 0) continue;

    if (item.selectedVariation && product.hasVariations && product.variations) {
      const variationIndex = product.variations.findIndex(v => {
        if (!v.attributes) return false;
        const vAttrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes.entries()) : v.attributes;
        const itemAttrs = item.selectedVariation?.attributes instanceof Map
          ? Object.fromEntries(item.selectedVariation.attributes.entries())
          : item.selectedVariation?.attributes || {};
        return Object.keys(vAttrs).every(key => vAttrs[key] === itemAttrs[key]);
      });
      if (variationIndex !== -1) {
        product.variations[variationIndex].stock = (product.variations[variationIndex].stock || 0) + qty;
        product.stock = product.variations.reduce((sum, v) => sum + (v.stock || 0), 0);
        await product.save();
      }
    } else {
      await Product.findByIdAndUpdate(
        productId,
        { $inc: { stock: qty } },
        { new: true }
      );
    }
  }
};

// Helper function to serialize order items (convert Map to object)
const serializeOrderItems = (items) => {
  if (!items || !Array.isArray(items)) return [];
  return items.map(item => {
    const itemObj = item.toObject ? item.toObject() : item;
    // Serialize selectedVariation if present
    if (itemObj.selectedVariation) {
      // Preserve all selectedVariation fields
      const serializedVariation = {
        stock: itemObj.selectedVariation.stock,
        price: itemObj.selectedVariation.price,
        discountPrice: itemObj.selectedVariation.discountPrice,
        images: itemObj.selectedVariation.images || [] // Preserve images array
      };
      
      // Serialize attributes Map to object
      if (itemObj.selectedVariation.attributes) {
        const attrs = {};
        if (itemObj.selectedVariation.attributes instanceof Map) {
          for (const [key, value] of itemObj.selectedVariation.attributes.entries()) {
            attrs[key] = value;
          }
        } else {
          Object.assign(attrs, itemObj.selectedVariation.attributes);
        }
        serializedVariation.attributes = attrs;
      }
      
      itemObj.selectedVariation = serializedVariation;
    }
    return itemObj;
  });
};

export const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('user', 'name email')
    .populate('orderItems.product') // Ensure product details are populated
    .sort({ createdAt: -1 })
    .lean(); // Use lean() to get plain objects

  // Serialize orders to convert Map objects to plain objects
  const serializedOrders = orders.map(order => ({
    ...order,
    orderItems: serializeOrderItems(order.orderItems)
  }));

  res.status(200).json(serializedOrders);
});

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('orderItems.product') // Ensure product details are populated
    .lean(); // Use lean() to get plain objects

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Serialize order to convert Map objects to plain objects
  const serializedOrder = {
    ...order,
    orderItems: serializeOrderItems(order.orderItems)
  };

  res.status(200).json(serializedOrder);
});

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, bankTransferProof, orderItems, totalPrice } = req.body;

  // Debug: Log the received data
  console.log('Create Order Request Body:', {
    paymentMethod,
    bankTransferProof,
    hasProof: !!bankTransferProof,
    proofType: typeof bankTransferProof,
    orderItems: orderItems ? orderItems.length : 'not provided',
    totalPrice
  });

  if (!shippingAddress || !paymentMethod) {
    res.status(400);
    throw new Error('Missing required fields: shippingAddress and paymentMethod are required');
  }

  const requiredAddressFields = ['fullName', 'email', 'address', 'city', 'postalCode', 'phone'];
  const missingFields = requiredAddressFields.filter(field => !shippingAddress[field]);

  if (missingFields.length > 0) {
    res.status(400);
    throw new Error(`Missing required shipping address fields: ${missingFields.join(', ')}`);
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  let finalOrderItems;
  let finalTotalPrice;

  // Fetch product details for orderItems
  let productMap = new Map();
  
  if (orderItems && orderItems.length > 0) {
    // Fetch all products at once for better performance
    const productIds = orderItems.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    productMap = new Map(products.map(p => [p._id.toString(), p]));
    
    // Build finalOrderItems using fetched products
    finalOrderItems = orderItems.map((item) => {
      const product = productMap.get(item.product.toString());
      if (!product) {
        res.status(400);
        throw new Error(`Product not found: ${item.product}`);
      }
      // Use price from request (which includes discountPrice if available), but validate it's not higher than regular price
      const requestedPrice = item.price || product.price;
      const finalPrice = requestedPrice <= product.price ? requestedPrice : product.price;
      
      const orderItem = {
        product: item.product,
        quantity: item.quantity,
        price: finalPrice, // Use price from request (discountPrice if available), validated against product.price
        name: product.name, // Copy product name
        image: product.images && product.images.length > 0 ? product.images[0] : '', // Default to main image
        selectedColor: item.selectedColor || '' // Copy selected color if present
      };
      
      // If variation exists, use variation image instead of main image, and store variation details
      if (item.selectedVariation) {
        // Convert Map to object if needed
        let attrs = {};
        if (item.selectedVariation.attributes) {
          if (item.selectedVariation.attributes instanceof Map) {
            for (const [key, value] of item.selectedVariation.attributes.entries()) {
              attrs[key] = value;
            }
          } else {
            attrs = item.selectedVariation.attributes;
          }
        }
        
        orderItem.selectedVariation = {
          attributes: new Map(Object.entries(attrs)),
          stock: item.selectedVariation.stock,
          price: item.selectedVariation.price,
          discountPrice: item.selectedVariation.discountPrice,
          images: item.selectedVariation.images || [] // Store variation images
        };
        
        // Use variation image if available, otherwise fallback to main image
        if (item.selectedVariation.images && item.selectedVariation.images.length > 0) {
          orderItem.image = item.selectedVariation.images[0];
        }
      }
      
      return orderItem;
    });
    finalTotalPrice = finalOrderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    console.log('Using orderItems from request body (with product details fetched)');
  } else {
    // Fallback to cart items
    const userWithCart = await User.findById(req.user._id).populate('cart.product');
    if (!userWithCart.cart || userWithCart.cart.length === 0) {
      res.status(400);
      throw new Error('No items in cart');
    }

    // Build product map from cart items for inventory check
    userWithCart.cart.forEach(item => {
      if (item.product) {
        productMap.set(item.product._id.toString(), item.product);
      }
    });

    finalOrderItems = userWithCart.cart.map(item => {
      const orderItem = {
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
        name: item.product.name, // Copy product name from populated cart item
        image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : '', // Default to main image
        selectedColor: item.selectedColor || '' // Copy selected color if present in cart item
      };
      
      // Include selected variation if present
      if (item.selectedVariation) {
        // Convert Map to object if needed
        let attrs = {};
        if (item.selectedVariation.attributes) {
          if (item.selectedVariation.attributes instanceof Map) {
            for (const [key, value] of item.selectedVariation.attributes.entries()) {
              attrs[key] = value;
            }
          } else {
            attrs = item.selectedVariation.attributes;
          }
        }
        
        orderItem.selectedVariation = {
          attributes: new Map(Object.entries(attrs)),
          stock: item.selectedVariation.stock,
          price: item.selectedVariation.price,
          discountPrice: item.selectedVariation.discountPrice,
          images: item.selectedVariation.images || [] // Store variation images
        };
        
        // Use variation price if available, otherwise use product price
        if (item.selectedVariation.price) {
          orderItem.price = item.selectedVariation.price;
        } else if (item.selectedVariation.discountPrice) {
          orderItem.price = item.selectedVariation.discountPrice;
        }
        
        // Use variation image if available, otherwise fallback to main image
        if (item.selectedVariation.images && item.selectedVariation.images.length > 0) {
          orderItem.image = item.selectedVariation.images[0];
        }
      }
      
      return orderItem;
    });
    finalTotalPrice = finalOrderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    console.log('Using cart items as fallback (with product details from populated cart)');
  }

  // Inventory check using already-fetched products (no additional DB query)
  for (const item of finalOrderItems) {
    const product = productMap.get(item.product.toString());
    if (!product) {
      res.status(400);
      throw new Error(`Product not found: ${item.product}`);
    }
    
    // Check stock for variations or regular product
    if (item.selectedVariation && product.hasVariations && product.variations) {
      // Find matching variation
      const matchingVariation = product.variations.find(v => {
        if (!v.attributes) return false;
        const vAttrs = v.attributes instanceof Map 
          ? Object.fromEntries(v.attributes.entries())
          : v.attributes;
        const itemAttrs = item.selectedVariation.attributes instanceof Map
          ? Object.fromEntries(item.selectedVariation.attributes.entries())
          : item.selectedVariation.attributes;
        
        return Object.keys(vAttrs).every(key => vAttrs[key] === itemAttrs[key]);
      });
      
      if (!matchingVariation) {
        res.status(400);
        throw new Error(`Variation not found for product: ${product.name}`);
      }
      
      if (matchingVariation.stock < item.quantity) {
        res.status(400);
        const attrsDesc = Object.entries(matchingVariation.attributes instanceof Map 
          ? Object.fromEntries(matchingVariation.attributes.entries())
          : matchingVariation.attributes).map(([k, v]) => `${k}: ${v}`).join(', ');
        throw new Error(`Insufficient stock for ${product.name} (${attrsDesc}). Available: ${matchingVariation.stock}, Requested: ${item.quantity}`);
      }
    } else {
      // Regular product stock check
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for product: ${product.name}`);
      }
    }
  }
  
  // Deduct stock in parallel for better performance
  const stockUpdatePromises = finalOrderItems.map(async (item) => {
    const product = await Product.findById(item.product);
    if (!product) return null;
    
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
    
    return product;
  });
  
  const updatedProducts = await Promise.all(stockUpdatePromises);
  
  // Check for low stock and send alert emails asynchronously
  const alertEmail = process.env.ALERT_EMAIL_USER || process.env.EMAIL_USER;
  updatedProducts.forEach((updatedProduct) => {
    if (updatedProduct && updatedProduct.stock > 0 && updatedProduct.stock < 5 && alertEmail) {
      sendEmail(
        alertEmail,
        `⚠️ Low Stock Alert — ${updatedProduct.name}`,
        `<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;border:1px solid #fbbf24;border-radius:8px;overflow:hidden;">
          <div style="background:#fbbf24;padding:14px 20px;"><h3 style="margin:0;color:#333;">Low Stock Alert</h3></div>
          <div style="padding:20px;">
            <p style="margin:0 0 8px;"><strong>${updatedProduct.name}</strong></p>
            <p style="margin:0;color:#dc2626;font-size:18px;font-weight:700;">Only ${updatedProduct.stock} left in stock</p>
          </div>
        </div>`
      ).catch(err => console.error('Failed to send low stock alert email:', err));
    }
  });

  try {
    const orderNumber = await Order.generateOrderNumber(); // Assuming this is a static method on Order model

    const orderData = {
      orderNumber,
      user: req.user._id,
      orderItems: finalOrderItems, // Use the enriched finalOrderItems
      shippingAddress,
      paymentMethod,
      totalPrice: finalTotalPrice,
    };

    if (bankTransferProof && paymentMethod === 'bank_transfer') {
      orderData.bankTransferProof = bankTransferProof;
      console.log('Adding bankTransferProof to order:', bankTransferProof);
    } else {
      console.log('Not adding bankTransferProof:', {
        hasProof: !!bankTransferProof,
        paymentMethod,
        condition: bankTransferProof && paymentMethod === 'bank_transfer'
      });
    }

    console.log('Final order data:', orderData);

    const order = await Order.create(orderData);

    // Build order items HTML for emails
    const orderItemsHtml = finalOrderItems.map(item => {
      const itemName = item.name || 'Product';
      const itemQty = item.quantity;
      const itemPrice = item.price;
      const itemTotal = (itemPrice * itemQty).toLocaleString('en-LK', { minimumFractionDigits: 2 });
      let variationText = '';
      if (item.selectedVariation && item.selectedVariation.attributes) {
        const attrs = item.selectedVariation.attributes instanceof Map
          ? Object.fromEntries(item.selectedVariation.attributes.entries())
          : item.selectedVariation.attributes;
        variationText = Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ');
      }
      return `
        <tr style="background:#ffffff;">
          <td style="padding:14px 20px;border-bottom:1px solid #e8e8e8;font-size:15px;font-weight:600;color:#1a1a1a;">${itemName}${variationText ? `<br><span style="font-size:12px;color:#555;font-weight:400;">${variationText}</span>` : ''}</td>
          <td style="padding:14px 20px;border-bottom:1px solid #e8e8e8;text-align:center;font-size:14px;color:#1a1a1a;">${itemQty}</td>
          <td style="padding:14px 20px;border-bottom:1px solid #e8e8e8;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;">Rs. ${itemTotal}</td>
        </tr>`;
    }).join('');

    const siteUrl = process.env.SITE_URL || 'https://www.evolexx.lk';
    const adminEmail = process.env.ALERT_EMAIL_USER || process.env.EMAIL_USER;
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const totalFormatted = finalTotalPrice.toLocaleString('en-LK', { minimumFractionDigits: 2 });

    // --- Admin notification email (invoice style, product first) ---
    const firstProductName = finalOrderItems[0]?.name || 'Order';
    const productSummary = finalOrderItems.length > 1
      ? `${firstProductName} + ${finalOrderItems.length - 1} more`
      : firstProductName;
    if (adminEmail) {
      sendEmail(
        adminEmail,
        `${productSummary} — Rs. ${totalFormatted} (#${orderNumber})`,
        `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:auto;background:#ffffff;color:#1a1a1a;">
          <div style="padding:24px 24px 16px;border-bottom:2px solid #1a1a1a;">
            <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1a1a1a;">EVOLEXX</h1>
            <p style="margin:0;font-size:14px;color:#1a1a1a;">INVOICE</p>
            <p style="margin:12px 0 0;font-size:13px;color:#444;">No. ${orderNumber} · Date: ${orderDate}</p>
          </div>
          <div style="padding:20px 24px;background:#ffffff;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#333;text-transform:uppercase;">Products Ordered</p>
            <h2 style="margin:0 0 4px;font-size:18px;font-weight:700;color:#1a1a1a;">${productSummary}</h2>
            <p style="margin:0;font-size:16px;font-weight:600;color:#1a1a1a;">Rs. ${totalFormatted}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;background:#ffffff;">
            <thead><tr style="background:#f0f0f0;">
              <th style="padding:12px 20px;text-align:left;font-size:12px;color:#1a1a1a;text-transform:uppercase;font-weight:600;">Product</th>
              <th style="padding:12px 20px;text-align:center;font-size:12px;color:#1a1a1a;text-transform:uppercase;font-weight:600;">Qty</th>
              <th style="padding:12px 20px;text-align:right;font-size:12px;color:#1a1a1a;text-transform:uppercase;font-weight:600;">Amount</th>
            </tr></thead>
            <tbody>${orderItemsHtml}</tbody>
            <tfoot><tr style="background:#f0f0f0;">
              <td colspan="2" style="padding:14px 20px;font-weight:700;color:#1a1a1a;font-size:14px;">Total</td>
              <td style="padding:14px 20px;text-align:right;font-weight:700;color:#1a1a1a;font-size:18px;">Rs. ${totalFormatted}</td>
            </tr></tfoot>
          </table>
          <div style="padding:20px 24px;background:#ffffff;border-top:1px solid #e0e0e0;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#1a1a1a;text-transform:uppercase;">Customer Details</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:#444;width:100px;font-size:14px;">Order ID</td><td style="padding:6px 0;font-weight:600;font-size:14px;color:#1a1a1a;">${orderNumber}</td></tr>
              <tr><td style="padding:6px 0;color:#444;font-size:14px;">Date</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${orderDate}</td></tr>
              <tr><td style="padding:6px 0;color:#444;font-size:14px;">Customer</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${shippingAddress.fullName}</td></tr>
              <tr><td style="padding:6px 0;color:#444;font-size:14px;">Email</td><td style="padding:6px 0;font-size:14px;"><a href="mailto:${shippingAddress.email}" style="color:#1a1a1a;">${shippingAddress.email}</a></td></tr>
              <tr><td style="padding:6px 0;color:#444;font-size:14px;">Phone</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${shippingAddress.phone}</td></tr>
              <tr><td style="padding:6px 0;color:#444;font-size:14px;">Address</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${shippingAddress.address}, ${shippingAddress.city} ${shippingAddress.postalCode}</td></tr>
              <tr><td style="padding:6px 0;color:#444;font-size:14px;">Payment</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;">${paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td></tr>
            </table>
          </div>
        </div>`
      ).catch(err => console.error('Failed to send admin notification email:', err));
    }

    // --- Customer confirmation email ---
    sendEmail(
      order.shippingAddress.email,
      `Order Confirmed — #${orderNumber}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;color:#1a1a1a;">
        <div style="padding:24px;border-bottom:2px solid #1a1a1a;">
          <h1 style="color:#1a1a1a;margin:0;font-size:22px;letter-spacing:2px;font-weight:700;">EVOLEXX</h1>
        </div>
        <div style="padding:28px 24px;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a;">Thank you for your order!</h2>
          <p style="color:#444;margin:0 0 20px;">Hi ${shippingAddress.fullName}, your order has been placed successfully and is being processed.</p>

          <div style="background:#f5f5f5;padding:16px;border-radius:6px;margin-bottom:20px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:4px 0;color:#444;width:130px;">Order Number</td><td style="padding:4px 0;font-weight:600;color:#1a1a1a;">${orderNumber}</td></tr>
              <tr><td style="padding:4px 0;color:#444;">Date</td><td style="padding:4px 0;color:#1a1a1a;">${orderDate}</td></tr>
              <tr><td style="padding:4px 0;color:#444;">Payment Method</td><td style="padding:4px 0;color:#1a1a1a;">${paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td></tr>
            </table>
          </div>

          <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
            <thead><tr style="background:#f0f0f0;">
              <th style="padding:12px 20px;text-align:left;font-size:12px;color:#1a1a1a;font-weight:600;">Item</th>
              <th style="padding:12px 20px;text-align:center;font-size:12px;color:#1a1a1a;font-weight:600;">Qty</th>
              <th style="padding:12px 20px;text-align:right;font-size:12px;color:#1a1a1a;font-weight:600;">Price</th>
            </tr></thead>
            <tbody>${orderItemsHtml}</tbody>
            <tfoot><tr style="background:#f0f0f0;">
              <td colspan="2" style="padding:14px 20px;font-weight:700;color:#1a1a1a;">Total</td>
              <td style="padding:14px 20px;text-align:right;font-weight:700;font-size:16px;color:#1a1a1a;">Rs. ${totalFormatted}</td>
            </tr></tfoot>
          </table>

          <div style="background:#f5f5f5;padding:16px;border-radius:6px;margin:20px 0;">
            <p style="margin:0 0 4px;font-weight:600;font-size:14px;color:#1a1a1a;">Shipping To</p>
            <p style="margin:0;color:#444;font-size:14px;line-height:1.6;">${shippingAddress.fullName}<br>${shippingAddress.address}<br>${shippingAddress.city}, ${shippingAddress.postalCode}<br>${shippingAddress.phone}</p>
          </div>

          <div style="text-align:center;margin:24px 0 16px;">
            <a href="${siteUrl}/order/${order._id}" style="display:inline-block;padding:14px 32px;background:#1a1a1a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">Track My Order</a>
          </div>

          <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;" />
          <p style="font-size:13px;color:#555;text-align:center;margin:0;">If you have any questions, reply to this email or contact us at ${adminEmail || 'support@evolexx.lk'}.</p>
          <p style="font-size:13px;color:#555;text-align:center;margin:8px 0 0;">Thank you for shopping with <strong>Evolexx</strong>!</p>
        </div>
      </div>`
    ).catch(err => console.error('Failed to send order confirmation email:', err));


    // Clear cart only if we used cart items (i.e., orderItems were not provided in request body)
    if (!req.body.orderItems || req.body.orderItems.length === 0) {
      user.cart = [];
      await user.save();
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('orderItems.product')
      .lean(); // Use lean() to get plain objects

    console.log('Created order with proof:', {
      orderId: populatedOrder._id,
      bankTransferProof: populatedOrder.bankTransferProof
    });

    // Serialize order to convert Map objects to plain objects
    const serializedOrder = {
      ...populatedOrder,
      orderItems: serializeOrderItems(populatedOrder.orderItems)
    };

    res.status(201).json(serializedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500);
    throw new Error('Error creating order: ' + error.message);
  }
});

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['pending', 'accepted', 'declined', 'approved', 'denied', 'shipped', 'delivered'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('orderItems.product'); // IMPORTANT: Populate product data for copying

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.status === status) {
    res.status(400);
    throw new Error(`Order is already ${status}`);
  }

  // Common check for user data before creating ToBeShipped entry
  if ((status === 'accepted' || status === 'approved' || status === 'shipped' || status === 'delivered') &&
    (!order.user || !order.user._id || !order.shippingAddress || !order.orderItems || order.orderItems.length === 0)) {
    res.status(500);
    throw new Error(`Order user, shipping address, or order items data missing for shipment transfer.`);
  }

  if (status === 'accepted') {
    const existingToBeShipped = await ToBeShipped.findOne({ orderId: order._id });
    if (existingToBeShipped) {
      res.status(400);
      throw new Error('Order is already marked for shipment.');
    }

    try {
      // Map order items to copy only necessary data to ToBeShipped (including variation details)
      const copiedOrderItems = order.orderItems.map(item => {
        const orderItem = {
          product: item.product._id, // Reference to the original Product ID
          name: item.product ? item.product.name : item.name || 'Unknown Product',
          quantity: item.quantity,
          price: item.price, // Price from the order, not necessarily current product price
          image: item.image || (item.product?.images && item.product.images.length > 0 ? item.product.images[0] : ''),
          selectedColor: item.selectedColor || '',
        };
        
        // Include variation details if present
        if (item.selectedVariation) {
          // Convert Map to object if needed
          let attrs = {};
          if (item.selectedVariation.attributes) {
            if (item.selectedVariation.attributes instanceof Map) {
              for (const [key, value] of item.selectedVariation.attributes.entries()) {
                attrs[key] = value;
              }
            } else {
              attrs = item.selectedVariation.attributes;
            }
          }
          
          orderItem.selectedVariation = {
            attributes: new Map(Object.entries(attrs)), // Store as Map for schema consistency
            stock: item.selectedVariation.stock,
            price: item.selectedVariation.price,
            discountPrice: item.selectedVariation.discountPrice,
            images: item.selectedVariation.images || []
          };
          
          // Use variation image if available, otherwise use item.image
          if (item.selectedVariation.images && item.selectedVariation.images.length > 0) {
            orderItem.image = item.selectedVariation.images[0];
          }
        }
        
        return orderItem;
      });

      const toBeShippedEntry = await ToBeShipped.create({
        orderId: order._id,
        user: order.user._id,
        orderNumber: order.orderNumber,
        customerName: order.user.name || order.shippingAddress.fullName || 'N/A', // Prioritize user name, then shipping name
        mobileNumber: order.shippingAddress.phone,
        address: order.shippingAddress.address,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        email: order.user.email || order.shippingAddress.email,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalPrice: order.totalPrice,
        status: 'accepted', // Initial status for ToBeShipped collection
        orderItems: copiedOrderItems, // Store the copied order items
      });

      // Delete the order from OrderList after moving to ToBeShipped
      await Order.findByIdAndDelete(req.params.id);

      res.status(200).json({
        message: 'Order accepted and moved to ToBeShipped collection.',
        toBeShippedEntry: toBeShippedEntry,
      });

    } catch (error) {
      console.error('Error during order acceptance and transfer to ToBeShipped:', error);
      res.status(500);
      throw new Error('Error processing order acceptance and transfer: ' + error.message);
    }
  }
  // If the status is 'approved' and you want to keep 'approved' as a separate flow
  // (e.g., admin approval before 'accepted' which moves it to ToBeShipped),
  // then you would define specific behavior here.
  // Given your current `ToBeShippedList` logic uses 'accepted', 'shipped', 'delivered',
  // it implies 'accepted' is the first status in the ToBeShipped lifecycle.
  // If 'approved' also means moving to ToBeShipped, then the 'accepted' block above should handle it.
  // For now, I'll remove the separate 'approved' block and assume 'accepted' is the one that moves it.
  // If you need distinct 'approved' -> OrderList then 'accepted' -> ToBeShipped, let me know.
  /*
  else if (status === 'approved') {
    // Current logic for 'approved' is same as 'accepted'
    // This part might be redundant if 'accepted' is the actual trigger for ToBeShipped
    const existingToBeShipped = await ToBeShipped.findOne({ orderId: order._id });
    if (existingToBeShipped) {
      res.status(400);
      throw new Error('Order is already marked for shipment.');
    }

    try {
      const copiedOrderItems = order.orderItems.map(item => ({
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : '',
        selectedColor: item.selectedColor || '',
      }));

      const toBeShippedEntry = await ToBeShipped.create({
        orderId: order._id,
        user: order.user._id,
        orderNumber: order.orderNumber,
        customerName: order.user.name || order.shippingAddress.fullName || 'N/A',
        mobileNumber: order.shippingAddress.phone,
        address: order.shippingAddress.address,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        email: order.user.email || order.shippingAddress.email,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalPrice: order.totalPrice,
        status: 'approved', // Or the correct initial status in ToBeShipped
        orderItems: copiedOrderItems,
      });

      await Order.findByIdAndDelete(req.params.id);

      res.status(200).json({
        message: 'Order status updated to approved and moved to ToBeShipped collection.',
        toBeShippedEntry: toBeShippedEntry,
      });

    } catch (error) {
      console.error('Error during order approval and transfer to ToBeShipped:', error);
      res.status(500);
      throw new Error('Error processing order approval and transfer: ' + error.message);
    }
  }
  */
  else {
    // Other status updates (pending, declined, denied, shipped, delivered)
    // When declined or denied, restore inventory
    if (status === 'declined' || status === 'denied') {
      await restoreOrderStock(order.orderItems);
    }

    order.status = status;
    await order.save();

    // If order is shipped or delivered, consider updating the ToBeShipped entry's status
    // instead of deleting from Order. (Assuming order is *moved* from Order to ToBeShipped upon 'accepted')
    // If you don't delete from Order, you would check for an existing ToBeShipped entry here:
    if (status === 'shipped' || status === 'delivered') {
      const existingToBeShipped = await ToBeShipped.findOne({ orderId: order._id });
      if (existingToBeShipped) {
        existingToBeShipped.status = status;
        if (status === 'shipped') existingToBeShipped.shippedAt = new Date();
        if (status === 'delivered') existingToBeShipped.deliveredAt = new Date();
        await existingToBeShipped.save();
        console.log(`ToBeShipped entry for order ${order._id} updated to status: ${status}`);
      } else {
        console.warn(`Attempted to update ToBeShipped status for order ${order._id} but no ToBeShipped entry found.`);
      }
    }

    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('orderItems.product')
      .lean(); // Use lean() to get plain objects

    // Serialize order to convert Map objects to plain objects
    const serializedOrder = {
      ...updatedOrder,
      orderItems: serializeOrderItems(updatedOrder.orderItems)
    };

    res.status(200).json(serializedOrder);
  }
});

// @desc    Update payment status
// @route   PATCH /api/orders/:id/payment
// @access  Private/Admin
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;

  if (!['pending', 'completed', 'failed'].includes(paymentStatus)) {
    res.status(400);
    throw new Error('Invalid payment status');
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { paymentStatus },
    { new: true }
  )
    .populate('orderItems.product')
    .lean(); // Use lean() to get plain objects

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Serialize order to convert Map objects to plain objects
  const serializedOrder = {
    ...order,
    orderItems: serializeOrderItems(order.orderItems)
  };

  res.status(200).json(serializedOrder);
});

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('orderItems.product');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Restore inventory before deleting
  await restoreOrderStock(order.orderItems);

  await Order.findByIdAndDelete(req.params.id);
  await ToBeShipped.deleteOne({ orderId: req.params.id });

  res.status(200).json({ message: 'Order deleted successfully' });
});

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('orderItems.product')
    .lean(); // Use lean() to get plain objects

  // Serialize orders to convert Map objects to plain objects
  const serializedOrders = orders.map(order => ({
    ...order,
    orderItems: serializeOrderItems(order.orderItems)
  }));

  res.status(200).json(serializedOrders);
});

// @desc    Get orders from 'ToBeShipped' collection (Admin) - **This function is now redundant as logic is in toBeShippedRoutes.js**
// @route   GET /api/tobeshipped/list (Moved to toBeShippedRoutes)
// @access  Private/Admin
// export const getToBeShippedOrders = asyncHandler(async (req, res) => { /* ... */ });

// @desc    Test route to create order with bank transfer proof
// @route   POST /api/orders/test-bank-transfer
// @access  Private/Admin
export const testBankTransferOrder = asyncHandler(async (req, res) => {
  try {
    const dummyProductId = '60c72b2f9f1b2c001c8e4d2a'; // **REPLACE with an actual product ID from your DB**
    const product = await Product.findById(dummyProductId);

    if (!product) {
      res.status(400).json({ message: 'Dummy product not found. Please update dummyProductId in orderController.' });
      return;
    }

    const testOrderData = {
      orderNumber: await Order.generateOrderNumber(),
      user: req.user._id,
      orderItems: [
        {
          product: product._id,
          quantity: 1,
          price: product.price, // Use actual product price
          name: product.name,
          image: product.images && product.images.length > 0 ? product.images[0] : '',
          selectedColor: 'Black' // Example color
        }
      ],
      shippingAddress: {
        fullName: 'Test User',
        email: 'test@example.com',
        address: '123 Test St',
        city: 'Test City',
        postalCode: '12345',
        phone: '1234567890'
      },
      paymentMethod: 'bank_transfer',
      totalPrice: product.price * 1, // Total price based on dummy product
      bankTransferProof: 'https://res.cloudinary.com/djp0x1vbx/image/upload/v1700000000/sample_proof.jpg' // Example Cloudinary URL
    };

    console.log('Creating test order with data:', testOrderData);

    const order = await Order.create(testOrderData);

    // No need to clear cart for a test order
    // user.cart = []; await user.save(); // Don't do this for test order

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('orderItems.product');

    console.log('Test order created:', {
      orderId: populatedOrder._id,
      bankTransferProof: populatedOrder.bankTransferProof,
      hasProof: !!populatedOrder.bankTransferProof
    });

    res.status(201).json({
      message: 'Test order created successfully',
      order: populatedOrder
    });
  } catch (error) {
      console.error('Error creating test order:', error);
      res.status(500).json({ message: 'Error creating test order: ' + error.message });
  }
});