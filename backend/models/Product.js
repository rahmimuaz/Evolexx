import mongoose from 'mongoose';

const generateProductId = () => {
  return 'PID-' + Math.random().toString(36).substr(2, 5).toUpperCase();
};

// Generate URL-friendly slug from product name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

const mobilePhoneSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  storage: { type: String, required: true },
  ram: { type: String, required: true },
  color: { type: String, required: true },
  screenSize: { type: String, required: true },
  batteryCapacity: { type: String, required: true },
  processor: { type: String, required: true },
  camera: { type: String, required: true },
  operatingSystem: { type: String, required: true }
});

const mobileAccessoriesSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  type: { type: String, required: true },
  compatibility: { type: String, required: true },
  color: { type: String, required: true },
  material: { type: String, required: true }
});

const preownedPhoneSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  condition: { type: String, required: true },
  storage: { type: String, required: true },
  ram: { type: String, required: true },
  color: { type: String, required: true },
  batteryHealth: { type: String, required: true },
  warranty: { type: String, required: true }
});

const laptopSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  processor: { type: String, required: true },
  ram: { type: String, required: true },
  storage: { type: String, required: true },
  display: { type: String, required: true },
  graphics: { type: String, required: true },
  operatingSystem: { type: String, required: true }
});

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    default: generateProductId,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Mobile Phone', 'Mobile Accessories', 'Preowned Phones', 'Laptops', 'Phone Covers', 'Chargers', 'Headphones', 'Earbuds', 'Smartwatches', 'Tablets', 'Screen Protectors', 'Cables', 'Other Accessories', 'Preowned Laptops', 'Preowned Tablets', 'Other']
  },
  price: {
    type: Number,
    required: true
  },
  discountPrice: {
    type: Number
  },
  description: {
    type: String,
    required: true
  },
  longDescription: {
    type: String
  },
  images: [{
    type: String,
    required: true
  }],
  // Color variants with their own images
  variants: [{
    color: {
      type: String,
      required: true
    },
    images: [{
      type: String,
      required: true
    }],
    stock: {
      type: Number,
      default: 0
    }
  }],
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  warrantyPeriod: {
    type: String,
    default: 'No Warranty'
  },
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      date: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Category-specific details
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  kokoPay: {
    type: Boolean,
    default: false
  },
  // New Arrivals feature
  isNewArrival: {
    type: Boolean,
    default: false
  },
  newArrivalOrder: {
    type: Number,
    default: 0
  },
  // General display order for product listing
  displayOrder: {
    type: Number,
    default: 0
  }
});

// Pre-save hook to generate slug from product name
productSchema.pre('save', async function(next) {
  // Only generate slug if name is modified or slug doesn't exist
  if (this.isModified('name') || !this.slug) {
    let baseSlug = generateSlug(this.name);
    let slug = baseSlug;
    let counter = 1;
    
    // Check for existing slugs and make unique if necessary
    while (true) {
      const existingProduct = await mongoose.model('Product').findOne({ 
        slug: slug,
        _id: { $ne: this._id } // Exclude current document
      });
      
      if (!existingProduct) {
        break;
      }
      
      // Append counter to make slug unique
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product; 