const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Therapist',
    required: true,
    unique: true,
    index: true,
  },
  tierKey: {
    type: String,
    required: true,
    enum: ['starter', 'pro', 'practice'],
    default: 'starter',
  },
  billingPeriod: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly',
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'cancelled', 'trialing'],
    default: 'active',
  },
  currentPeriodStart: { type: Date, default: Date.now },
  currentPeriodEnd: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  razorpaySubscriptionId: { type: String, default: null },
  cancelAtPeriodEnd: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Subscription', SubscriptionSchema);
