const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
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
  serviceName: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  startDateTime: { type: Date, required: true, index: true },
  endDateTime: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no-show'],
    default: 'confirmed',
    index: true,
  },
  clientTimezone: { type: String, default: 'Asia/Kolkata' },
  meetLink: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'package_deducted', 'refunded'],
    default: 'unpaid',
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null,
  },
  clientPackageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientPackage',
    default: null,
  },
  clientNotes: { type: String, default: '' },
  cancellationReason: { type: String, default: '' },
  cancelledBy: { type: String, enum: ['therapist', 'client', 'system', ''], default: '' },
  cancelledAt: { type: Date, default: null },
}, { timestamps: true });

// Compound indexes for fast overlap checks and scheduling queries
SessionSchema.index({ therapistId: 1, status: 1, startDateTime: 1, endDateTime: 1 });
SessionSchema.index({ clientId: 1, startDateTime: -1 });

module.exports = mongoose.model('Session', SessionSchema);
