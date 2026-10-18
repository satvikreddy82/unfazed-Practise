const mongoose = require('mongoose');

const ConsentRecordSchema = new mongoose.Schema({
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
  consentVersion: { type: String, default: '1.0' },
  consentText: {
    type: String,
    required: true,
    default: 'I agree to voluntary participation in psychotherapy, understand the confidentiality and emergency limits, and consent to the payment and cancellation policy.',
  },
  agreed: { type: Boolean, required: true },
  agreedAt: { type: Date, default: Date.now },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
}, { timestamps: true });

ConsentRecordSchema.index({ therapistId: 1, clientId: 1, consentVersion: 1 });

module.exports = mongoose.model('ConsentRecord', ConsentRecordSchema);
