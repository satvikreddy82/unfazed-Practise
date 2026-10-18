const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
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
  amount: { type: Number, required: true }, // In INR (e.g., 2000)
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
    default: 'created',
    index: true,
  },
  itemType: {
    type: String,
    enum: ['session', 'package', 'subscription'],
    required: true,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  itemDescription: { type: String, default: 'Therapy Service' },
  razorpayOrderId: { type: String, default: null, index: true },
  razorpayPaymentId: { type: String, default: null, index: true },
  razorpaySignature: { type: String, default: null },
  invoiceNumber: { type: String, required: true, unique: true },
  invoiceDate: { type: Date, default: Date.now },
  taxDetails: {
    hasGst: { type: Boolean, default: false },
    gstRatePercent: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
  },
  isSimulated: { type: Boolean, default: false }, // Clearly marked if test simulator used
  webhookProcessed: { type: Boolean, default: false },
  webhookEventId: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

PaymentSchema.index({ therapistId: 1, createdAt: -1 });
PaymentSchema.index({ clientId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
