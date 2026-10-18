const mongoose = require('mongoose');

const TimeSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // Format "HH:mm" (24h)
  endTime: { type: String, required: true },   // Format "HH:mm" (24h)
}, { _id: false });

const DayScheduleSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday, 1 = Monday, etc.
  isAvailable: { type: Boolean, default: true },
  slots: [TimeSlotSchema],
}, { _id: false });

const DateOverrideSchema = new mongoose.Schema({
  date: { type: String, required: true }, // "YYYY-MM-DD"
  isAvailable: { type: Boolean, default: false },
  slots: [TimeSlotSchema],
  reason: { type: String, default: '' },
}, { _id: false });

const AvailabilitySchema = new mongoose.Schema({
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Therapist',
    required: true,
    unique: true,
    index: true,
  },
  timezone: { type: String, default: 'Asia/Kolkata' },
  slotDurations: [{ type: Number, enum: [30, 45, 60, 90], default: [30, 45, 60, 90] }],
  defaultDuration: { type: Number, default: 60 },
  bufferMinutes: { type: Number, default: 15, enum: [0, 5, 10, 15, 20, 30] },
  noticeHours: { type: Number, default: 4 },
  maxAdvanceDays: { type: Number, default: 60 },
  weeklySchedule: [DayScheduleSchema],
  overrides: [DateOverrideSchema],
  blockedDates: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Availability', AvailabilitySchema);
