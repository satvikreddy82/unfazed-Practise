const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, default: null },
  userRole: { type: String, default: 'anonymous' },
  action: { type: String, required: true },
  targetResource: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
}, { timestamps: true });

AuditLogSchema.index({ therapistId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
