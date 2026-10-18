const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ClientSchema = new mongoose.Schema({
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
  passwordHash: { type: String, default: null },
  phone: { type: String, default: '' },
  emergencyContact: {
    name: { type: String, default: '' },
    relation: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  tags: [{ type: String }],
  notes: { type: String, default: '' }, // Therapist administrative note
  status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
  intakeCompleted: { type: Boolean, default: false },
  consentAgreed: { type: Boolean, default: false },
  consentTimestamp: { type: Date, default: null },
  role: { type: String, default: 'client' },
}, { timestamps: true });

// Ensure email is unique per therapist practice
ClientSchema.index({ therapistId: 1, email: 1 }, { unique: true });

ClientSchema.pre('save', async function (next) {
  if (!this.passwordHash || !this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

ClientSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('Client', ClientSchema);
