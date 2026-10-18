const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SessionOfferingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: Number, required: true, enum: [30, 45, 60, 90] },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
}, { _id: true });

const TherapistSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  passwordHash: { type: String, required: true },
  slug: {
    type: String,
    required: [true, 'Profile slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  title: { type: String, default: 'Licensed Clinical Psychologist' },
  bio: { type: String, default: '' },
  qualifications: [{ type: String }],
  specializations: [{ type: String }],
  languages: [{ type: String }],
  profileImage: { type: String, default: '' },
  phone: { type: String, default: '' },
  practiceDetails: {
    clinicName: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: 'New Delhi' },
    country: { type: String, default: 'India' },
    registrationNumber: { type: String, default: '' },
    gstNumber: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
  },
  sessionOfferings: [SessionOfferingSchema],
  themePreference: {
    theme: {
      type: String,
      default: 'emerald_gold',
      enum: [
        'emerald_gold',
        'navy_cyan',
        'charcoal_electric_blue',
        'black_lime',
        'orange_navy',
        'purple_pink',
        'red_cream',
        'golden_violet',
        'forest_blush',
        'royal_plum_mint',
      ],
    },
    mode: { type: String, default: 'light', enum: ['light', 'dark', 'system'] },
  },
  subscriptionTier: { type: String, default: 'starter', enum: ['starter', 'pro', 'practice'] },
  subscriptionStatus: { type: String, default: 'active', enum: ['active', 'trialing', 'past_due', 'cancelled'] },
  role: { type: String, default: 'therapist' },
}, { timestamps: true });

TherapistSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

TherapistSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Safe public profile serializer - strips all private information
TherapistSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    title: this.title,
    bio: this.bio,
    qualifications: this.qualifications,
    specializations: this.specializations,
    languages: this.languages,
    profileImage: this.profileImage,
    practiceDetails: {
      clinicName: this.practiceDetails.clinicName,
      city: this.practiceDetails.city,
      country: this.practiceDetails.country,
      currency: this.practiceDetails.currency,
    },
    sessionOfferings: this.sessionOfferings.filter(o => o.isAvailable),
    themePreference: this.themePreference,
  };
};

module.exports = mongoose.model('Therapist', TherapistSchema);
