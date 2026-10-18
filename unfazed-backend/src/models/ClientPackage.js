const mongoose = require('mongoose');

const ClientPackageSchema = new mongoose.Schema({
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Therapist',
    required: true,
    index: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true,
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
    unique: true, // Prevent duplicate package credits for same payment
  },
  packageName: { type: String, required: true },
  sessionsTotal: { type: Number, required: true },
  sessionsUsed: { type: Number, default: 0 },
  sessionsRemaining: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'exhausted', 'expired'],
    default: 'active',
    index: true,
  },
}, { timestamps: true });

ClientPackageSchema.index({ clientId: 1, status: 1 });

module.exports = mongoose.model('ClientPackage', ClientPackageSchema);
