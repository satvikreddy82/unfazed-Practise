const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Therapist',
    required: true,
    index: true,
  },
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  phone: { type: String, default: '' },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'converted', 'archived'],
    default: 'new',
    index: true,
  },
  preferredService: { type: String, default: '' },
  message: { type: String, default: '' },
  notes: { type: String, default: '' },
  followUpDate: { type: Date, default: null },
  convertedClientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    default: null,
  },
}, { timestamps: true });

LeadSchema.index({ therapistId: 1, email: 1 });

module.exports = mongoose.model('Lead', LeadSchema);
