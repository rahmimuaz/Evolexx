// ReturnRequest.js - Product return requests
import mongoose from 'mongoose';

const returnRequestSchema = mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
    },
    toBeShippedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ToBeShipped',
      required: false,
    },
    orderType: {
      type: String,
      enum: ['Order', 'ToBeShipped'],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    reason: {
      type: String,
      enum: ['defective', 'wrong_item', 'changed_mind', 'not_as_described', 'other'],
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'received', 'refunded'],
      default: 'pending',
    },
    totalRefundAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const ReturnRequest = mongoose.models.ReturnRequest || mongoose.model('ReturnRequest', returnRequestSchema);
export default ReturnRequest;
