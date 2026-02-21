import ReturnRequest from '../models/ReturnRequest.js';
import Order from '../models/Order.js';
import ToBeShipped from '../models/ToBeShipped.js';
import asyncHandler from 'express-async-handler';

// @desc    Create a return request (client)
// @route   POST /api/returns
// @access  Private (user)
export const createReturnRequest = asyncHandler(async (req, res) => {
  if (req.userType === 'admin') {
    res.status(403);
    throw new Error('Admins cannot create return requests.');
  }

  const { orderId, toBeShippedId, orderType, items, reason, description } = req.body;

  if (!orderType || !items || !Array.isArray(items) || items.length === 0 || !reason) {
    res.status(400);
    throw new Error('Order type, items, and reason are required.');
  }

  let order;
  let orderNumber;

  if (orderType === 'Order') {
    order = await Order.findOne({ _id: orderId, user: req.user._id }).populate('orderItems.product');
    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }
    if (order.status !== 'delivered') {
      res.status(400);
      throw new Error('Only delivered orders can be returned.');
    }
    orderNumber = order.orderNumber;
  } else {
    order = await ToBeShipped.findOne({ _id: toBeShippedId, user: req.user._id }).populate('orderItems.product');
    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }
    if (order.status !== 'delivered') {
      res.status(400);
      throw new Error('Only delivered orders can be returned.');
    }
    orderNumber = order.orderNumber;
  }

  // Check if return already exists for this order
  const existingReturn = await ReturnRequest.findOne({
    $or: [{ orderId }, { toBeShippedId }],
    status: { $in: ['pending', 'approved', 'received'] },
  });
  if (existingReturn) {
    res.status(400);
    throw new Error('A return request already exists for this order.');
  }

  const validReasons = ['defective', 'wrong_item', 'changed_mind', 'not_as_described', 'other'];
  if (!validReasons.includes(reason)) {
    res.status(400);
    throw new Error('Invalid return reason.');
  }

  const returnItems = [];
  let totalRefundAmount = 0;

  for (const item of items) {
    const idx = item.orderItemIndex;
    const requestedQty = item.quantity || 1;
    if (idx == null || idx < 0 || idx >= order.orderItems.length) {
      res.status(400);
      throw new Error('Invalid order item index.');
    }
    const oi = order.orderItems[idx];
    const qty = Math.min(requestedQty, oi.quantity || 1);
    const price = oi.price || oi.selectedVariation?.price || 0;
    const name = oi.name || oi.product?.name || 'Product';
    returnItems.push({
      product: oi.product?._id || oi.product,
      name,
      quantity: qty,
      price,
    });
    totalRefundAmount += price * qty;
  }

  const returnRequest = await ReturnRequest.create({
    orderId: orderType === 'Order' ? orderId : undefined,
    toBeShippedId: orderType === 'ToBeShipped' ? toBeShippedId : undefined,
    orderType,
    user: req.user._id,
    orderNumber,
    items: returnItems,
    reason,
    description: description || '',
    totalRefundAmount,
  });

  const populated = await ReturnRequest.findById(returnRequest._id).populate('items.product', 'name images');
  res.status(201).json(populated);
});

// @desc    Get my return requests (client)
// @route   GET /api/returns/my
// @access  Private (user)
export const getMyReturns = asyncHandler(async (req, res) => {
  if (req.userType === 'admin') {
    res.status(403);
    throw new Error('Use admin endpoints for admin access.');
  }

  const returns = await ReturnRequest.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('items.product', 'name images');
  res.json(returns);
});

// @desc    Get return by ID (client - own only)
// @route   GET /api/returns/:id
// @access  Private (user)
export const getReturnById = asyncHandler(async (req, res) => {
  const ret = await ReturnRequest.findById(req.params.id).populate('items.product', 'name images');
  if (!ret) {
    res.status(404);
    throw new Error('Return request not found.');
  }
  if (req.userType === 'user' && ret.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this return.');
  }
  res.json(ret);
});

// @desc    Get all return requests (admin)
// @route   GET /api/returns/admin/list
// @access  Private (admin)
export const getAdminReturns = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const returns = await ReturnRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate('user', 'name email')
    .populate('items.product', 'name images');
  res.json(returns);
});

// @desc    Update return status (admin)
// @route   PATCH /api/returns/admin/:id/status
// @access  Private (admin)
export const updateReturnStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['approved', 'rejected', 'received', 'refunded'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Valid status required: approved, rejected, received, refunded.');
  }

  const ret = await ReturnRequest.findById(req.params.id);
  if (!ret) {
    res.status(404);
    throw new Error('Return request not found.');
  }

  const flow = { pending: ['approved', 'rejected'], approved: ['received'], received: ['refunded'] };
  const allowed = flow[ret.status];
  if (!allowed || !allowed.includes(status)) {
    res.status(400);
    throw new Error(`Cannot change status from ${ret.status} to ${status}.`);
  }

  ret.status = status;
  await ret.save();

  const populated = await ReturnRequest.findById(ret._id)
    .populate('user', 'name email')
    .populate('items.product', 'name images');
  res.json(populated);
});
