const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Availability = require('../models/Availability');
const Subscription = require('../models/Subscription');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'unfazed_production_super_secret_jwt_key_2026_dev_mode', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Generate default availability schedule for new therapist
const createDefaultAvailability = async (therapistId) => {
  const weeklySchedule = [];
  for (let day = 0; day <= 6; day++) {
    // Mon (1) to Fri (5) are available 09:00 to 17:00
    const isWeekday = day >= 1 && day <= 5;
    weeklySchedule.push({
      dayOfWeek: day,
      isAvailable: isWeekday,
      slots: isWeekday
        ? [
            { startTime: '10:00', endTime: '13:00' },
            { startTime: '14:00', endTime: '18:00' },
          ]
        : [],
    });
  }

  await Availability.create({
    therapistId,
    timezone: 'Asia/Kolkata',
    slotDurations: [30, 45, 60, 90],
    defaultDuration: 60,
    bufferMinutes: 15,
    noticeHours: 4,
    maxAdvanceDays: 60,
    weeklySchedule,
    overrides: [],
    blockedDates: [],
  });
};

/**
 * Universal Registration for Therapist practice or Client portal
 */
exports.registerTherapist = async (req, res) => {
  try {
    const { role = 'therapist', name, email, password, slug, title, specializations, phone, therapistSlug } = req.body;

    // 1. CLIENT REGISTRATION
    if (role === 'client') {
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required for client registration.',
        });
      }

      const cleanEmail = email.toLowerCase().trim();

      // Check if client account already exists with password
      let client = await Client.findOne({ email: cleanEmail });
      if (client && client.passwordHash) {
        return res.status(400).json({
          success: false,
          message: 'A client account with this email already exists. Please sign in.',
        });
      }

      // Find practice
      let therapist = null;
      if (therapistSlug) {
        therapist = await Therapist.findOne({ slug: therapistSlug.toLowerCase().trim() });
      }
      if (!therapist) {
        therapist = await Therapist.findOne();
      }

      if (!therapist) {
        return res.status(500).json({
          success: false,
          message: 'No active clinical practice found to connect with.',
        });
      }

      if (client) {
        // Upgrade existing self-booked client with portal password
        client.passwordHash = password;
        client.name = name.trim();
        if (phone) client.phone = phone;
        await client.save();
      } else {
        client = await Client.create({
          therapistId: therapist._id,
          name: name.trim(),
          email: cleanEmail,
          passwordHash: password,
          phone: phone || '',
          status: 'active',
          role: 'client',
        });
      }

      const token = generateToken({
        id: client._id,
        role: 'client',
        email: client.email,
      });

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: client._id,
          name: client.name,
          email: client.email,
          role: 'client',
          therapistId: client.therapistId,
        },
      });
    }

    // 2. THERAPIST REGISTRATION
    if (!name || !email || !password || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and profile slug are required.',
      });
    }

    // Check email uniqueness
    const existingEmail = await Therapist.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Check slug uniqueness
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const existingSlug = await Therapist.findOne({ slug: cleanSlug });
    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: 'This profile slug is already claimed. Please choose another.',
      });
    }

    // Create therapist
    const therapist = await Therapist.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      slug: cleanSlug,
      title: title || 'Licensed Clinical Psychologist',
      specializations: specializations || ['Individual Therapy', 'Anxiety & Depression'],
      languages: ['English', 'Hindi'],
      phone: phone || '',
      sessionOfferings: [
        {
          title: 'Initial Consultation',
          duration: 60,
          price: 2000,
          description: 'Comprehensive initial evaluation and treatment planning session.',
          isAvailable: true,
        },
        {
          title: 'Individual Therapy Session',
          duration: 60,
          price: 2500,
          description: 'Standard 60-minute one-on-one psychotherapy consultation.',
          isAvailable: true,
        },
        {
          title: 'Brief Follow-up Session',
          duration: 30,
          price: 1500,
          description: '30-minute check-in or progress review session.',
          isAvailable: true,
        },
      ],
      subscriptionTier: 'starter',
      subscriptionStatus: 'active',
    });

    // Create default availability schedule & subscription
    await Promise.all([
      createDefaultAvailability(therapist._id),
      Subscription.create({
        therapistId: therapist._id,
        tierKey: 'starter',
        status: 'active',
      }),
    ]);

    const token = generateToken({
      id: therapist._id,
      role: 'therapist',
      email: therapist.email,
      slug: therapist.slug,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        role: 'therapist',
        slug: therapist.slug,
        subscriptionTier: therapist.subscriptionTier,
        themePreference: therapist.themePreference,
      },
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed. Please check inputs and try again.',
    });
  }
};

/**
 * Universal Login for Therapist, Client, or Admin
 */
exports.login = async (req, res) => {
  try {
    const { email, password, roleHint } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check Admin Credentials
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@unfazed.in').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminUnfazed2026!';
    if (cleanEmail === adminEmail && password === adminPassword) {
      const token = generateToken({
        id: 'admin_master_id',
        role: 'admin',
        email: adminEmail,
      });
      return res.json({
        success: true,
        token,
        user: {
          id: 'admin_master_id',
          name: 'Platform Administrator',
          email: adminEmail,
          role: 'admin',
        },
      });
    }

    // 2. Check Therapist
    if (!roleHint || roleHint === 'therapist') {
      const therapist = await Therapist.findOne({ email: cleanEmail });
      if (therapist) {
        const isMatch = await therapist.comparePassword(password);
        if (isMatch) {
          const token = generateToken({
            id: therapist._id,
            role: 'therapist',
            email: therapist.email,
            slug: therapist.slug,
          });
          return res.json({
            success: true,
            token,
            user: {
              id: therapist._id,
              name: therapist.name,
              email: therapist.email,
              role: 'therapist',
              slug: therapist.slug,
              subscriptionTier: therapist.subscriptionTier,
              themePreference: therapist.themePreference,
            },
          });
        }
      }
    }

    // 3. Check Client
    if (!roleHint || roleHint === 'client') {
      const client = await Client.findOne({ email: cleanEmail });
      if (client && client.passwordHash) {
        const isMatch = await client.comparePassword(password);
        if (isMatch) {
          const token = generateToken({
            id: client._id,
            role: 'client',
            email: client.email,
          });
          return res.json({
            success: true,
            token,
            user: {
              id: client._id,
              name: client.name,
              email: client.email,
              role: 'client',
              therapistId: client.therapistId,
            },
          });
        }
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid email or password. Please verify your credentials.',
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during login.',
    });
  }
};

/**
 * Get current authenticated user profile
 */
exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (req.user.role === 'admin') {
      return res.json({
        success: true,
        user: {
          id: 'admin_master_id',
          name: 'Platform Administrator',
          email: req.user.email,
          role: 'admin',
        },
      });
    }

    if (req.user.role === 'therapist') {
      const therapist = await Therapist.findById(req.user.id).select('-passwordHash');
      return res.json({
        success: true,
        user: {
          id: therapist._id,
          name: therapist.name,
          email: therapist.email,
          role: 'therapist',
          slug: therapist.slug,
          title: therapist.title,
          bio: therapist.bio,
          specializations: therapist.specializations,
          languages: therapist.languages,
          qualifications: therapist.qualifications,
          sessionOfferings: therapist.sessionOfferings,
          practiceDetails: therapist.practiceDetails,
          subscriptionTier: therapist.subscriptionTier,
          themePreference: therapist.themePreference,
        },
      });
    }

    if (req.user.role === 'client') {
      const client = await Client.findById(req.user.id).select('-passwordHash');
      return res.json({
        success: true,
        user: {
          id: client._id,
          name: client.name,
          email: client.email,
          role: 'client',
          therapistId: client.therapistId,
          intakeCompleted: client.intakeCompleted,
          consentAgreed: client.consentAgreed,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Request password reset
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  // In production, send email with reset token. Here return a safe simulated response
  const therapist = await Therapist.findOne({ email: email.toLowerCase() });
  const client = await Client.findOne({ email: email.toLowerCase() });

  if (therapist || client) {
    const resetToken = crypto.randomBytes(20).toString('hex');
    console.log(`[Auth: Password Reset Token Generated for ${email}]: ${resetToken}`);
  }

  res.json({
    success: true,
    message: 'If an account exists with this email address, password reset instructions have been sent.',
  });
};
