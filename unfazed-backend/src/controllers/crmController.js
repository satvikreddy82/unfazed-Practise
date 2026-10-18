const Client = require('../models/Client');
const Lead = require('../models/Lead');
const Session = require('../models/Session');
const Payment = require('../models/Payment');
const SessionNote = require('../models/SessionNote');
const IntakeSubmission = require('../models/IntakeSubmission');
const ConsentRecord = require('../models/ConsentRecord');
const Therapist = require('../models/Therapist');
const entitlementService = require('../services/entitlementService');

/**
 * List clients with search, status filter, tag filter, and pagination
 */
exports.getClients = async (req, res) => {
  try {
    const { search, status, tag, page = 1, limit = 20 } = req.query;
    const query = req.user.role === 'admin' ? {} : { therapistId: req.user.id };

    if (status && status !== 'all') {
      query.status = status;
    }
    if (tag) {
      query.tags = tag;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [clients, total] = await Promise.all([
      Client.find(query).sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Client.countDocuments(query),
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      clients,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add a new client (Gated by subscription active client limit!)
 */
exports.createClient = async (req, res) => {
  try {
    const { name, email, phone, tags, notes, emergencyContact } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    // Check Entitlement: Active client limit
    const entitlementCheck = await entitlementService.canAccess(req.user.id, 'add_client');
    if (!entitlementCheck.allowed) {
      return res.status(403).json({
        success: false,
        entitlementError: true,
        message: entitlementCheck.reason,
        details: entitlementCheck,
      });
    }

    // Check duplicate client in this practice
    const existing = await Client.findOne({
      therapistId: req.user.id,
      email: email.toLowerCase().trim(),
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A client with this email already exists in your practice.',
      });
    }

    const client = await Client.create({
      therapistId: req.user.id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      tags: tags || [],
      notes: notes || '',
      emergencyContact: emergencyContact || {},
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Client added to practice CRM.',
      client,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get client details with full clinical CRM history
 */
exports.getClientDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findOne({ _id: id, therapistId: req.user.id });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    // Fetch related records in parallel
    const [sessions, payments, notes, intake, consent] = await Promise.all([
      Session.find({ clientId: client._id }).sort({ startDateTime: -1 }),
      Payment.find({ clientId: client._id }).sort({ createdAt: -1 }),
      SessionNote.find({ clientId: client._id, therapistId: req.user.id }).sort({ createdAt: -1 }),
      IntakeSubmission.findOne({ clientId: client._id }),
      ConsentRecord.findOne({ clientId: client._id }).sort({ createdAt: -1 }),
    ]);

    res.json({
      success: true,
      client,
      sessions,
      payments,
      notes, // Therapist sees all clinical notes (private and shared)
      intake,
      consent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update client profile / tags / notes
 */
exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, tags, notes, status, emergencyContact } = req.body;

    const client = await Client.findOne({ _id: id, therapistId: req.user.id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    if (name) client.name = name;
    if (phone !== undefined) client.phone = phone;
    if (tags !== undefined) client.tags = tags;
    if (notes !== undefined) client.notes = notes;
    if (status) client.status = status;
    if (emergencyContact) client.emergencyContact = emergencyContact;

    await client.save();

    res.json({ success: true, message: 'Client updated successfully.', client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------- LEAD MANAGEMENT -----------------

/**
 * Public lead capture from therapist's profile
 */
exports.capturePublicLead = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, email, phone, preferredService, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const therapist = await Therapist.findOne({ slug: slug.toLowerCase() });
    if (!therapist) {
      return res.status(404).json({ success: false, message: 'Therapist profile not found.' });
    }

    // Check if lead already exists
    let lead = await Lead.findOne({
      therapistId: therapist._id,
      email: email.toLowerCase().trim(),
    });

    if (lead) {
      lead.name = name;
      lead.phone = phone || lead.phone;
      lead.message = message || lead.message;
      lead.status = 'new';
      await lead.save();
    } else {
      lead = await Lead.create({
        therapistId: therapist._id,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone || '',
        preferredService: preferredService || '',
        message: message || '',
        status: 'new',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Inquiry received. The practice will get back to you shortly.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List leads for therapist
 */
exports.getLeads = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { therapistId: req.user.id };
    if (status && status !== 'all') {
      query.status = status;
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: leads.length, leads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update lead status or notes
 */
exports.updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, followUpDate } = req.body;

    const lead = await Lead.findOne({ _id: id, therapistId: req.user.id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

    if (status) lead.status = status;
    if (notes !== undefined) lead.notes = notes;
    if (followUpDate !== undefined) lead.followUpDate = followUpDate;

    await lead.save();

    res.json({ success: true, message: 'Lead updated.', lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 1-Click Convert Lead to Client without duplicate records
 */
exports.convertLeadToClient = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findOne({ _id: id, therapistId: req.user.id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

    // Check Entitlement: Active client limit
    const entitlementCheck = await entitlementService.canAccess(req.user.id, 'add_client');
    if (!entitlementCheck.allowed) {
      return res.status(403).json({
        success: false,
        entitlementError: true,
        message: entitlementCheck.reason,
      });
    }

    // Check if client already exists
    let client = await Client.findOne({
      therapistId: req.user.id,
      email: lead.email,
    });

    if (!client) {
      client = await Client.create({
        therapistId: req.user.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: 'active',
        tags: ['Converted Lead'],
        notes: `Converted from lead. Initial inquiry: "${lead.message}". Notes: ${lead.notes}`,
      });
    }

    lead.status = 'converted';
    lead.convertedClientId = client._id;
    await lead.save();

    res.json({
      success: true,
      message: 'Lead successfully converted to active practice client!',
      client,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------- INTAKE & CONSENT -----------------

/**
 * Submit or update intake form
 */
exports.submitIntake = async (req, res) => {
  try {
    const { clientId, presentingConcern, demographics, previousTherapyExperience, currentMedications, goalsForTherapy } = req.body;

    // Check authority: therapist, or the client themselves
    let targetClientId = clientId;
    let targetTherapistId = req.user.id;

    if (req.user.role === 'client') {
      targetClientId = req.user.id;
      targetTherapistId = req.user.therapistId;
    }

    if (!presentingConcern) {
      return res.status(400).json({ success: false, message: 'Presenting concern is required.' });
    }

    let intake = await IntakeSubmission.findOne({
      therapistId: targetTherapistId,
      clientId: targetClientId,
    });

    if (intake) {
      intake.presentingConcern = presentingConcern;
      if (demographics) intake.demographics = { ...intake.demographics, ...demographics };
      if (previousTherapyExperience !== undefined) intake.previousTherapyExperience = previousTherapyExperience;
      if (currentMedications !== undefined) intake.currentMedications = currentMedications;
      if (goalsForTherapy !== undefined) intake.goalsForTherapy = goalsForTherapy;
      await intake.save();
    } else {
      intake = await IntakeSubmission.create({
        therapistId: targetTherapistId,
        clientId: targetClientId,
        presentingConcern,
        demographics: demographics || {},
        previousTherapyExperience: previousTherapyExperience || '',
        currentMedications: currentMedications || '',
        goalsForTherapy: goalsForTherapy || '',
      });
    }

    // Mark intake completed on client record
    await Client.findByIdAndUpdate(targetClientId, { intakeCompleted: true });

    res.status(201).json({
      success: true,
      message: 'Intake information saved securely.',
      intake,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Submit mandatory informed consent
 */
exports.agreeConsent = async (req, res) => {
  try {
    const { agreed, consentVersion = '1.0', consentText } = req.body;

    if (!agreed) {
      return res.status(400).json({
        success: false,
        message: 'Consent must be explicitly accepted to proceed.',
      });
    }

    let targetClientId = req.user.id;
    let targetTherapistId = req.user.therapistId;

    if (req.user.role === 'therapist') {
      // Therapist recording client's written consent
      targetClientId = req.body.clientId;
      targetTherapistId = req.user.id;
    }

    const consent = await ConsentRecord.create({
      therapistId: targetTherapistId,
      clientId: targetClientId,
      consentVersion,
      consentText: consentText || 'I agree to voluntary participation in psychotherapy, understand confidentiality boundaries, and accept practice policies.',
      agreed: true,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      agreedAt: new Date(),
    });

    await Client.findByIdAndUpdate(targetClientId, {
      consentAgreed: true,
      consentTimestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Consent agreement recorded with audit trail.',
      consent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
