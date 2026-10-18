const SessionNote = require('../models/SessionNote');
const Session = require('../models/Session');
const Client = require('../models/Client');
const entitlementService = require('../services/entitlementService');

/**
 * Get Clinical Notes
 * CRITICAL SECURITY BARRIER:
 * - When requested by a Client (req.user.role === 'client'):
 *   1. Database query strictly enforces { isPrivate: false, clientId: req.user.id }
 *   2. Controller iterates and explicitly validates note.isPrivate === false
 *   3. Note serialization uses toClientSafe()
 * - When requested by a Therapist (req.user.role === 'therapist'):
 *   Query is scoped to { therapistId: req.user.id }
 */
exports.getNotes = async (req, res) => {
  try {
    const { clientId, sessionId, search } = req.query;

    // CLIENT ACCESS CONTEXT
    if (req.user.role === 'client') {
      const clientQuery = {
        clientId: req.user.id,
        isPrivate: false, // HARD ENFORCED DB QUERY BARRIER
      };

      if (sessionId) clientQuery.sessionId = sessionId;

      const notes = await SessionNote.find(clientQuery)
        .sort({ createdAt: -1 })
        .select('title noteType content sharedWithClientAt createdAt updatedAt sessionId');

      // Double-check serialization barrier
      const safeNotes = notes.map((note) => {
        if (note.isPrivate === true) {
          throw new Error('Critical Security Violation: Private note matched client query!');
        }
        return note.toClientSafe ? note.toClientSafe() : note;
      });

      return res.json({ success: true, count: safeNotes.length, notes: safeNotes });
    }

    // THERAPIST ACCESS CONTEXT
    if (req.user.role === 'therapist') {
      const query = { therapistId: req.user.id };

      if (clientId) query.clientId = clientId;
      if (sessionId) query.sessionId = sessionId;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { 'content.freeform.body': { $regex: search, $options: 'i' } },
          { 'content.soap.subjective': { $regex: search, $options: 'i' } },
          { 'content.soap.assessment': { $regex: search, $options: 'i' } },
        ];
      }

      const notes = await SessionNote.find(query)
        .populate('clientId', 'name email')
        .populate('sessionId', 'serviceName startDateTime')
        .sort({ createdAt: -1 });

      return res.json({ success: true, count: notes.length, notes });
    }

    return res.status(403).json({ success: false, message: 'Unauthorized role' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single note by ID with strict privacy barrier
 */
exports.getNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === 'client') {
      const note = await SessionNote.findOne({
        _id: id,
        clientId: req.user.id,
        isPrivate: false, // HARD ENFORCED DB QUERY
      });

      // If note does not exist or is private, return 404 (do not leak existence)
      if (!note || note.isPrivate === true) {
        return res.status(404).json({
          success: false,
          message: 'Note not found or not shared with client.',
        });
      }

      return res.json({ success: true, note: note.toClientSafe() });
    }

    if (req.user.role === 'therapist') {
      const note = await SessionNote.findOne({
        _id: id,
        therapistId: req.user.id,
      })
        .populate('clientId', 'name email')
        .populate('sessionId', 'serviceName startDateTime');

      if (!note) {
        return res.status(404).json({ success: false, message: 'Note not found.' });
      }

      return res.json({ success: true, note });
    }

    return res.status(403).json({ success: false, message: 'Unauthorized role' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a Session Note (Therapist only)
 * Gated by subscription entitlement for advanced templates (SOAP, DAP)
 */
exports.createNote = async (req, res) => {
  try {
    const { clientId, sessionId, title, noteType = 'freeform', isPrivate = true, content } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Client ID is required.' });
    }

    // Verify client belongs to therapist practice
    const client = await Client.findOne({ _id: clientId, therapistId: req.user.id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found in your practice.' });
    }

    // Entitlement Check: Note template (SOAP and DAP require Pro or Practice)
    const entitlementCheck = await entitlementService.canAccess(req.user.id, 'note_template', {
      template: noteType,
    });

    if (!entitlementCheck.allowed) {
      return res.status(403).json({
        success: false,
        entitlementError: true,
        message: entitlementCheck.reason,
        details: entitlementCheck,
      });
    }

    const note = await SessionNote.create({
      therapistId: req.user.id,
      clientId,
      sessionId: sessionId || null,
      title: title || `${noteType.toUpperCase()} Clinical Note`,
      noteType,
      isPrivate: isPrivate !== false, // default true
      content: content || {},
      sharedWithClientAt: isPrivate === false ? new Date() : null,
      auditHistory: [
        {
          editedBy: req.user.id,
          editedAt: new Date(),
          action: 'created',
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Clinical note saved successfully.',
      note,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update an existing note
 */
exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isPrivate } = req.body;

    const note = await SessionNote.findOne({ _id: id, therapistId: req.user.id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (isPrivate !== undefined) {
      note.isPrivate = isPrivate;
      if (isPrivate === false && !note.sharedWithClientAt) {
        note.sharedWithClientAt = new Date();
      }
    }

    note.auditHistory.push({
      editedBy: req.user.id,
      editedAt: new Date(),
      action: 'updated',
    });

    await note.save();

    res.json({ success: true, message: 'Note updated successfully.', note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a note
 */
exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await SessionNote.findOneAndDelete({ _id: id, therapistId: req.user.id });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });

    res.json({ success: true, message: 'Note deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
