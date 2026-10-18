const mongoose = require('mongoose');

const SubscriptionTierConfigSchema = new mongoose.Schema({
  tierKey: {
    type: String,
    required: true,
    unique: true,
    enum: ['starter', 'pro', 'practice'],
  },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  priceMonthly: { type: Number, required: true }, // in INR
  priceYearly: { type: Number, required: true },  // in INR
  activeClientLimit: { type: Number, required: true }, // -1 for unlimited
  enabledFeatures: [{ type: String }],
  // E.g. ['basic_notes', 'advanced_notes', 'basic_analytics', 'advanced_analytics', 'packages', 'custom_branding', 'unlimited_clients']
  allowedNoteTemplates: [{
    type: String,
    enum: ['freeform', 'soap', 'dap'],
  }],
  analyticsAccessLevel: {
    type: String,
    enum: ['basic', 'advanced'],
    default: 'basic',
  },
  isPopular: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionTierConfig', SubscriptionTierConfigSchema);
