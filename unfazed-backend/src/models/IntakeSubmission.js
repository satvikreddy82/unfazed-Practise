const mongoose = require('mongoose');

const IntakeSubmissionSchema = new mongoose.Schema({
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
  demographics: {
    dateOfBirth: { type: String, default: '' },
    gender: { type: String, default: '' },
    occupation: { type: String, default: '' },
    city: { type: String, default: '' },
    preferredLanguage: { type: String, default: 'English' },
  },
  presentingConcern: { type: String, required: true },
  previousTherapyExperience: { type: String, default: '' },
  currentMedications: { type: String, default: '' },
  goalsForTherapy: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

IntakeSubmissionSchema.index({ therapistId: 1, clientId: 1 }, { unique: true });

module.exports = mongoose.model('IntakeSubmission', IntakeSubmissionSchema);
