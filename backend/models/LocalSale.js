import mongoose from 'mongoose';

const localSaleSchema = mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
    },
    customerAddress: {
      type: String,
    },
    saleDate: {
      type: Date,
      default: Date.now,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
        selectedVariation: {
          attributes: {
            type: Map,
            of: String,
          },
          stock: Number,
          price: Number,
          discountPrice: Number,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'other'],
      default: 'cash',
    },
    notes: {
      type: String,
    },
    qrCodeUrl: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

localSaleSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    try {
      // Get count of documents with same date prefix to ensure uniqueness
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const datePrefix = `INV-${year}${month}${day}-`;
      
      // Find the highest number for today's invoices
      const todayInvoices = await mongoose.model('LocalSale').find({
        invoiceNumber: { $regex: `^${datePrefix}` }
      }).sort({ invoiceNumber: -1 }).limit(1);
      
      let nextNumber = 1;
      if (todayInvoices.length > 0) {
        const lastNumber = parseInt(todayInvoices[0].invoiceNumber.split('-')[2]) || 0;
        nextNumber = lastNumber + 1;
      }
      
      this.invoiceNumber = `${datePrefix}${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      // Fallback to simple count if error occurs
      const count = await mongoose.model('LocalSale').countDocuments();
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      this.invoiceNumber = `INV-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
    }
  }
  next();
});

const LocalSale = mongoose.model('LocalSale', localSaleSchema);

export default LocalSale;
