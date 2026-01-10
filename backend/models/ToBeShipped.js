// models/ToBeShipped.js
import mongoose from 'mongoose';

const toBeShippedSchema = mongoose.Schema(
  {
    orderId: { // Reference to the original Order _id
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false, // Make it optional if you might create ToBeShipped without an original Order reference later
    },
    user: { // Reference to the user who placed the original order
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true, // Assuming order numbers are unique across all orders
    },
    customerName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      required: true,
      default: 'pending',
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    status: {
      type: String,
      required: true,
      enum: ['accepted', 'shipped', 'delivered', 'cancelled'], // Added 'cancelled' for completeness
      default: 'accepted',
    },
    orderItems: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        image: { type: String }, // Product or variation image URL
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        selectedVariation: {
          attributes: {
            type: Map,
            of: String
          },
          stock: Number,
          price: Number,
          discountPrice: Number,
          images: [String] // Variation-specific images
        },
        selectedColor: { type: String }, // Legacy support - if your products have colors
      },
    ],
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const ToBeShipped = mongoose.model('ToBeShipped', toBeShippedSchema);

export default ToBeShipped;