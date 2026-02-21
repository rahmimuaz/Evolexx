import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import ToBeShipped from '../models/ToBeShipped.js';
// We don't need to import the Order model here anymore if we're not directly
// using it for populate, as the relevant data is now copied.

const router = express.Router();

// Helper function to serialize ToBeShipped order items (convert Map to object)
const serializeToBeShippedItems = (items) => {
  if (!items || !Array.isArray(items)) return [];
  return items.map(item => {
    const itemObj = item.toObject ? item.toObject() : item;
    // Serialize selectedVariation if present
    if (itemObj.selectedVariation && itemObj.selectedVariation.attributes) {
      const attrs = {};
      if (itemObj.selectedVariation.attributes instanceof Map) {
        for (const [key, value] of itemObj.selectedVariation.attributes.entries()) {
          attrs[key] = value;
        }
      } else {
        Object.assign(attrs, itemObj.selectedVariation.attributes);
      }
      itemObj.selectedVariation.attributes = attrs;
    }
    return itemObj;
  });
};

// @desc    Update ToBeShipped order status (shipped, delivered)
// @route   PATCH /api/tobeshipped/:id/status
// @access  Private/Admin
router.patch('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['shipped', 'delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use "shipped" or "delivered".' });
    }
    const order = await ToBeShipped.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (status === 'shipped' && order.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted orders can be marked as shipped.' });
    }
    if (status === 'delivered' && order.status !== 'shipped') {
      return res.status(400).json({ message: 'Only shipped orders can be marked as delivered.' });
    }
    order.status = status;
    if (status === 'shipped') order.shippedAt = new Date();
    if (status === 'delivered') order.deliveredAt = new Date();
    await order.save();
    const serialized = { ...order.toObject(), orderItems: serializeToBeShippedItems(order.orderItems) };
    res.status(200).json(serialized);
  } catch (error) {
    console.error('[toBeShippedRoutes] Error updating status:', error);
    res.status(500).json({ message: 'Error updating order status: ' + error.message });
  }
});

// @desc    Get all ToBeShipped orders (for admin), optionally filtered by status
// @route   GET /api/tobeshipped/list?status=accepted|shipped|delivered
// @access  Private/Admin
router.get('/list', protect, admin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && ['accepted', 'shipped', 'delivered'].includes(status) ? { status } : {};
    console.log('[toBeShippedRoutes] Fetching to-be-shipped list...', filter);
    const list = await ToBeShipped.find(filter)
      .sort({ createdAt: -1 })
      // Populate orderId just for its _id. The other data (orderNumber, totalPrice, paymentMethod)
      // is now directly on the ToBeShipped document.
      .populate('orderId', '_id')
      .populate('user', 'name email') // Still populate user for basic user info
      .lean(); // Use lean() to get plain objects

    // Serialize orders to convert Map objects to plain objects
    const serializedList = list.map(order => ({
      ...order,
      orderItems: serializeToBeShippedItems(order.orderItems)
    }));

    res.status(200).json(serializedList);
  } catch (error) {
    console.error('[toBeShippedRoutes] Error fetching to-be-shipped list:', error);
    res.status(500).json({ message: 'Error fetching to-be-shipped list: ' + error.message });
  }
});

// @desc    Get logged in user's ToBeShipped orders
// @route   GET /api/tobeshipped/myorders
// @access  Private
router.get('/myorders', protect, async (req, res) => {
  try {
    const userToBeShippedOrders = await ToBeShipped.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      // Only populate _id from Order here too, as other data is direct
      .populate('orderId', '_id')
      .populate('user', 'name email') // Still populate user for basic user info
      .lean(); // Use lean() to get plain objects

    // Serialize orders to convert Map objects to plain objects
    const serializedOrders = userToBeShippedOrders.map(order => ({
      ...order,
      orderItems: serializeToBeShippedItems(order.orderItems)
    }));

    res.status(200).json(serializedOrders);
  } catch (error) {
    console.error('[toBeShippedRoutes] Error fetching user\'s to-be-shipped orders:', error);
    res.status(500).json({ message: 'Error fetching your orders.' });
  }
});

// @desc    Get single ToBeShipped order by ID (for user or admin viewing)
// @route   GET /api/tobeshipped/order/:id
// @access  Private
router.get('/order/:id', protect, async (req, res) => {
  try {
    // Find the ToBeShipped document by its _id
    const toBeShippedOrder = await ToBeShipped.findById(req.params.id)
      .populate('user', 'name email') // Populate user for name/email if needed
      .lean(); // Use lean() to get plain objects

    if (!toBeShippedOrder) {
      res.status(404);
      throw new Error('To Be Shipped Order not found');
    }

    // Optional: Add authorization check if needed, e.g., only the associated user or admin can view
    // if (toBeShippedOrder.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    //   res.status(403); // Forbidden
    //   throw new Error('Not authorized to view this shipment.');
    // }

    // Serialize order to convert Map objects to plain objects
    const serializedOrder = {
      ...toBeShippedOrder,
      orderItems: serializeToBeShippedItems(toBeShippedOrder.orderItems)
    };

    res.status(200).json(serializedOrder);

  } catch (error) {
    console.error(`[toBeShippedRoutes] Error fetching single to-be-shipped order with ID ${req.params.id}:`, error);
    // Send a more informative error message to the client
    res.status(error.statusCode || 500).json({ message: error.message || 'Error fetching to-be-shipped order details.' });
  }
});


// The commented-out '/accept-order' route logic remains unchanged.
// It's still recommended to handle order status updates (like 'accepted')
// in the orderController.js, as it involves logic across collections.
/*
router.post('/accept-order/:orderId', protect, admin, async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate('user'); // Populate user if needed to get user._id easily

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if already in ToBeShipped to prevent duplicates
        const existingToBeShipped = await ToBeShipped.findOne({ orderId: order._id });
        if (existingToBeShipped) {
            return res.status(400).json({ message: 'Order already marked for shipping' });
        }

        const newToBeShipped = new ToBeShipped({
            orderId: order._id,
            user: order.user._id, // CRITICAL: Get user ID from the original order
            customerName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`, // Example
            mobileNumber: order.shippingAddress.phone, // Example
            address: `${order.shippingAddress.address}, ${order.shippingAddress.city}`, // Example
            city: order.shippingAddress.city,
            postalCode: order.shippingAddress.postalCode,
            email: order.user.email, // Assuming you have an email on the order or user model
            paymentStatus: order.paymentStatus || 'completed', // Or whatever your order's payment status is
            status: 'accepted' // Initial status for ToBeShipped
        });

        const createdToBeShipped = await newToBeShipped.save();

        // Optionally, update the original Order's status if you're not deleting it
        // order.status = 'Accepted'; // Or 'Ready for Shipping'
        // await order.save();

        res.status(201).json(createdToBeShipped);

    } catch (error) {
        console.error('Error accepting order:', error);
        res.status(500).json({ message: 'Server error when accepting order' });
    }
});
*/

export default router;