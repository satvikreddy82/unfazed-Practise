const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Therapist',
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  sessionCount: { type: Number, required: true, enum: [3, 6, 12] },
  price: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  validityDays: { type: Number, default: 90 }, // e.g. 90 days validity
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

PackageSchema.index({ therapistId: 1, isActive: 1 });

module.exports = mongoose.model('Package', PackageSchema);
