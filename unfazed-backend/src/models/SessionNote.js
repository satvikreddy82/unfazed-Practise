const mongoose = require('mongoose');

const NoteAuditSchema = new mongoose.Schema({
  editedAt: { type: Date, default: Date.now },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist' },
  action: { type: String, default: 'update' },
}, { _id: false });

const SessionNoteSchema = new mongoose.Schema({
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
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null,
    index: true,
  },
  title: { type: String, default: 'Clinical Note' },
  noteType: {
    type: String,
    enum: ['soap', 'dap', 'freeform'],
    default: 'freeform',
  },
  isPrivate: {
    type: Boolean,
    default: true,
    index: true,
  },
  content: {
    soap: {
      subjective: { type: String, default: '' },
      objective: { type: String, default: '' },
      assessment: { type: String, default: '' },
      plan: { type: String, default: '' },
    },
    dap: {
      data: { type: String, default: '' },
      assessment: { type: String, default: '' },
      plan: { type: String, default: '' },
    },
    freeform: {
      body: { type: String, default: '' },
    },
  },
  sharedWithClientAt: { type: Date, default: null },
  auditHistory: [NoteAuditSchema],
}, { timestamps: true });

// Ensure fast retrieval by therapist, client, and privacy filter
SessionNoteSchema.index({ therapistId: 1, clientId: 1, isPrivate: 1 });
SessionNoteSchema.index({ clientId: 1, isPrivate: 1 });

// Helper to sanitize note for client viewing
SessionNoteSchema.methods.toClientSafe = function () {
  if (this.isPrivate) {
    throw new Error('Access denied: Cannot serialize private note for client view.');
  }
  return {
    id: this._id,
    sessionId: this.sessionId,
    title: this.title,
    noteType: this.noteType,
    content: this.content,
    sharedWithClientAt: this.sharedWithClientAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('SessionNote', SessionNoteSchema);
