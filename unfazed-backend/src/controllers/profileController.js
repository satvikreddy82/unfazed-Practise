const Therapist = require('../models/Therapist');
const Availability = require('../models/Availability');

/**
 * Public Profile by Slug: Strict data sanitation, no passwords or internal private data
 */
exports.getPublicProfileBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cleanSlug = slug.toLowerCase().trim();

    const therapist = await Therapist.findOne({ slug: cleanSlug });
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist practice not found. Please check the URL.',
      });
    }

    // Return sanitized public profile
    res.json({
      success: true,
      therapist: therapist.toPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get My Profile (authenticated therapist)
 */
exports.getMyProfile = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const primaryTherapist = await Therapist.findOne();
      return res.json({
        success: true,
        therapist: primaryTherapist
          ? primaryTherapist.toPublicProfile()
          : { name: 'Platform Administrator', title: 'Administrator', slug: 'admin' },
        availability: null,
      });
    }

    const therapist = await Therapist.findById(req.user.id);
    if (!therapist) {
      return res.status(404).json({ success: false, message: 'Therapist not found' });
    }
    const availability = await Availability.findOne({ therapistId: req.user.id });
    res.json({
      success: true,
      therapist: therapist.toPublicProfile(),
      availability: availability || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Therapist Profile Details
 */
exports.updateProfile = async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.user.id);
    if (!therapist) {
      return res.status(404).json({ success: false, message: 'Therapist not found' });
    }

    const {
      name,
      title,
      bio,
      qualifications,
      specializations,
      languages,
      phone,
      practiceDetails,
      sessionOfferings,
    } = req.body;

    if (name) therapist.name = name;
    if (title !== undefined) therapist.title = title;
    if (bio !== undefined) therapist.bio = bio;
    if (qualifications !== undefined) therapist.qualifications = qualifications;
    if (specializations !== undefined) therapist.specializations = specializations;
    if (languages !== undefined) therapist.languages = languages;
    if (phone !== undefined) therapist.phone = phone;
    if (practiceDetails !== undefined) {
      therapist.practiceDetails = {
        ...therapist.practiceDetails,
        ...practiceDetails,
      };
    }
    if (sessionOfferings !== undefined) {
      therapist.sessionOfferings = sessionOfferings;
    }

    await therapist.save();

    res.json({
      success: true,
      message: 'Practice profile updated successfully.',
      therapist: therapist.toPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Check and update profile slug
 */
exports.updateSlug = async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ success: false, message: 'Slug is required' });

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const existing = await Therapist.findOne({ slug: cleanSlug, _id: { $ne: req.user.id } });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This branded URL slug is already taken. Please choose another.',
      });
    }

    const therapist = await Therapist.findById(req.user.id);
    therapist.slug = cleanSlug;
    await therapist.save();

    res.json({
      success: true,
      message: 'Branded URL slug updated successfully.',
      slug: cleanSlug,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Theme & Appearance Preferences
 */
exports.updateThemePreference = async (req, res) => {
  try {
    const { theme, mode } = req.body;
    const therapist = await Therapist.findById(req.user.id);
    if (!therapist) return res.status(404).json({ success: false, message: 'Therapist not found' });

    if (theme) therapist.themePreference.theme = theme;
    if (mode) therapist.themePreference.mode = mode;

    await therapist.save();

    res.json({
      success: true,
      message: 'Theme preference saved.',
      themePreference: therapist.themePreference,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
