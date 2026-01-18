import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster lookups
settingsSchema.index({ key: 1 });

// Pre-save hook to update updatedAt
settingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
