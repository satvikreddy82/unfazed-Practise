const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  role: { type: String, enum: ['therapist', 'client'], required: true },
  name: { type: String, required: true },
  unreadCount: { type: Number, default: 0 },
}, { _id: false });

const ConversationSchema = new mongoose.Schema({
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
  participants: [ParticipantSchema],
  lastMessageText: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now, index: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

ConversationSchema.index({ therapistId: 1, clientId: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
