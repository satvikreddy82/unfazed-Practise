const mongoose = require('mongoose');
const { parseISO, addMinutes, isBefore, isAfter, format, startOfDay, endOfDay } = require('date-fns');
const Availability = require('../models/Availability');
const Session = require('../models/Session');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const notificationService = require('../services/notificationService');

/**
 * Get therapist availability settings
 */
exports.getAvailability = async (req, res) => {
  try {
    let availability = await Availability.findOne({ therapistId: req.user.id });
    if (!availability) {
      availability = await Availability.create({
        therapistId: req.user.id,
        weeklySchedule: [
          { dayOfWeek: 1, isAvailable: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
          { dayOfWeek: 2, isAvailable: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
          { dayOfWeek: 3, isAvailable: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
          { dayOfWeek: 4, isAvailable: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
          { dayOfWeek: 5, isAvailable: true, slots: [{ startTime: '10:00', endTime: '18:00' }] },
          { dayOfWeek: 6, isAvailable: false, slots: [] },
          { dayOfWeek: 0, isAvailable: false, slots: [] },
        ],
      });
    }

    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update therapist availability settings
 */
exports.updateAvailability = async (req, res) => {
  try {
    const {
      timezone,
      weeklySchedule,
      bufferMinutes,
      defaultDuration,
      noticeHours,
      overrides,
      blockedDates,
    } = req.body;

    let availability = await Availability.findOne({ therapistId: req.user.id });
    if (!availability) {
      availability = new Availability({ therapistId: req.user.id });
    }

    if (timezone) availability.timezone = timezone;
    if (weeklySchedule) availability.weeklySchedule = weeklySchedule;
    if (bufferMinutes !== undefined) availability.bufferMinutes = bufferMinutes;
    if (defaultDuration !== undefined) availability.defaultDuration = defaultDuration;
    if (noticeHours !== undefined) availability.noticeHours = noticeHours;
    if (overrides) availability.overrides = overrides;
    if (blockedDates) availability.blockedDates = blockedDates;

    await availability.save();

    res.json({
      success: true,
      message: 'Availability settings saved successfully.',
      availability,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public slot calculator for a therapist's branded page
 * Calculates real-time open slots accounting for:
 * 1. Weekly schedule or date override
 * 2. Blocked dates
 * 3. Existing sessions (confirmed/pending) + buffer time
 * 4. Notice hours (advance booking window)
 */
exports.getPublicAvailableSlots = async (req, res) => {
  try {
    const { slug } = req.params;
    const { date, duration = 60, timezone = 'Asia/Kolkata' } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date (YYYY-MM-DD) is required.' });
    }

    const therapist = await Therapist.findOne({ slug: slug.toLowerCase() });
    if (!therapist) {
      return res.status(404).json({ success: false, message: 'Therapist not found.' });
    }

    const availability = await Availability.findOne({ therapistId: therapist._id });
    if (!availability) {
      return res.json({ success: true, slots: [], message: 'No schedule configured.' });
    }

    // 1. Check if date is blocked
    if (availability.blockedDates && availability.blockedDates.includes(date)) {
      return res.json({ success: true, slots: [], message: 'Date is blocked by therapist.' });
    }

    // 2. Determine schedule for the day (Override takes precedence over weekly)
    const targetDate = new Date(`${date}T00:00:00.000Z`);
    const dayOfWeek = targetDate.getUTCDay();

    const override = availability.overrides?.find((o) => o.date === date);
    let daySchedule = null;

    if (override) {
      if (!override.isAvailable) {
        return res.json({ success: true, slots: [], message: 'Date is marked unavailable.' });
      }
      daySchedule = override.slots;
    } else {
      const regularDay = availability.weeklySchedule?.find((d) => d.dayOfWeek === dayOfWeek);
      if (!regularDay || !regularDay.isAvailable) {
        return res.json({ success: true, slots: [], message: 'Therapist does not consult on this day of week.' });
      }
      daySchedule = regularDay.slots;
    }

    if (!daySchedule || daySchedule.length === 0) {
      return res.json({ success: true, slots: [] });
    }

    // 3. Fetch existing sessions for this therapist on this date
    const startOfRequestedDay = new Date(`${date}T00:00:00.000Z`);
    const endOfRequestedDay = new Date(`${date}T23:59:59.999Z`);

    const existingSessions = await Session.find({
      therapistId: therapist._id,
      status: { $in: ['confirmed', 'pending'] },
      startDateTime: { $lt: endOfRequestedDay },
      endDateTime: { $gt: startOfRequestedDay },
    });

    const parsedDuration = parseInt(duration, 10) || 60;
    const buffer = availability.bufferMinutes || 0;
    const noticeMs = (availability.noticeHours || 4) * 60 * 60 * 1000;
    const earliestAllowedTime = new Date(Date.now() + noticeMs);

    const generatedSlots = [];

    // 4. Generate candidate slots within each configured time window
    for (const window of daySchedule) {
      const [startHour, startMin] = window.startTime.split(':').map(Number);
      const [endHour, endMin] = window.endTime.split(':').map(Number);

      let currentSlotStart = new Date(`${date}T00:00:00.000Z`);
      currentSlotStart.setUTCHours(startHour, startMin, 0, 0);

      const windowEnd = new Date(`${date}T00:00:00.000Z`);
      windowEnd.setUTCHours(endHour, endMin, 0, 0);

      while (true) {
        const currentSlotEnd = addMinutes(currentSlotStart, parsedDuration);
        if (isAfter(currentSlotEnd, windowEnd)) {
          break; // Slot exceeds current window
        }

        // Check advance notice requirement
        if (isBefore(currentSlotStart, earliestAllowedTime)) {
          currentSlotStart = addMinutes(currentSlotEnd, buffer);
          continue;
        }

        // Check collision against all existing appointments with buffer
        const hasCollision = existingSessions.some((session) => {
          // Add buffer to session boundaries
          const sessionStartWithBuffer = addMinutes(new Date(session.startDateTime), -buffer);
          const sessionEndWithBuffer = addMinutes(new Date(session.endDateTime), buffer);

          return (
            (isAfter(currentSlotEnd, session.startDateTime) && isBefore(currentSlotStart, session.endDateTime)) ||
            (isAfter(currentSlotEnd, sessionStartWithBuffer) && isBefore(currentSlotStart, sessionEndWithBuffer))
          );
        });

        if (!hasCollision) {
          // Format slot for client
          generatedSlots.push({
            startDateTime: currentSlotStart.toISOString(),
            endDateTime: currentSlotEnd.toISOString(),
            formattedTime: format(currentSlotStart, 'hh:mm a'),
            formattedDate: format(currentSlotStart, 'MMM d, yyyy'),
            duration: parsedDuration,
          });
        }

        // Increment for next candidate slot
        currentSlotStart = addMinutes(currentSlotEnd, buffer);
      }
    }

    res.json({
      success: true,
      date,
      therapistId: therapist._id,
      timezone: availability.timezone,
      slots: generatedSlots,
    });
  } catch (error) {
    console.error('[Slot Calculation Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ATOMIC APPOINTMENT BOOKING
 * Strictly prevents double-booking under concurrent requests
 */
exports.bookAppointment = async (req, res) => {
  let dbSession = null;
  let useTransaction = false;

  try {
    const isReplicaSet = !!mongoose.connection.client?.topology?.description?.setName;
    if (isReplicaSet) {
      dbSession = await mongoose.startSession();
      dbSession.startTransaction();
      useTransaction = true;
    }
  } catch (err) {
    dbSession = null;
    useTransaction = false;
  }

  try {
    const {
      slug,
      serviceName,
      duration = 60,
      startDateTime,
      clientName,
      clientEmail,
      clientPhone,
      clientNotes,
      clientTimezone = 'Asia/Kolkata',
      paymentMethod = 'test_simulation',
    } = req.body;

    if (!slug || !serviceName || !startDateTime || !clientName || !clientEmail) {
      if (useTransaction && dbSession) {
        await dbSession.abortTransaction();
        dbSession.endSession();
      }
      return res.status(400).json({
        success: false,
        message: 'Missing required booking fields (serviceName, startDateTime, clientName, clientEmail).',
      });
    }

    const therapistQuery = Therapist.findOne({ slug: slug.toLowerCase() });
    if (useTransaction) therapistQuery.session(dbSession);
    const therapist = await therapistQuery;

    if (!therapist) {
      if (useTransaction && dbSession) {
        await dbSession.abortTransaction();
        dbSession.endSession();
      }
      return res.status(404).json({ success: false, message: 'Therapist not found.' });
    }

    const startDate = new Date(startDateTime);
    const parsedDuration = parseInt(duration, 10) || 60;
    const endDate = addMinutes(startDate, parsedDuration);

    // 1. STRICT ATOMIC OVERLAP CHECK
    // If any active session exists where:
    // startDateTime < newEndDate AND endDateTime > newStartDate
    const conflictQuery = Session.findOne({
      therapistId: therapist._id,
      status: { $in: ['confirmed', 'pending'] },
      startDateTime: { $lt: endDate },
      endDateTime: { $gt: startDate },
    });
    if (useTransaction) conflictQuery.session(dbSession);
    const conflictingSession = await conflictQuery;

    if (conflictingSession) {
      if (useTransaction && dbSession) {
        await dbSession.abortTransaction();
        dbSession.endSession();
      }
      return res.status(409).json({
        success: false,
        doubleBookingPrevented: true,
        message: 'This time slot is no longer available. Please select another slot.',
      });
    }

    // 2. Find or register the client under this therapist
    const clientQuery = Client.findOne({
      therapistId: therapist._id,
      email: clientEmail.toLowerCase().trim(),
    });
    if (useTransaction) clientQuery.session(dbSession);
    let client = await clientQuery;

    if (!client) {
      if (useTransaction) {
        client = (await Client.create(
          [
            {
              therapistId: therapist._id,
              name: clientName.trim(),
              email: clientEmail.toLowerCase().trim(),
              phone: clientPhone || '',
              status: 'active',
            },
          ],
          { session: dbSession }
        ))[0];
      } else {
        client = await Client.create({
          therapistId: therapist._id,
          name: clientName.trim(),
          email: clientEmail.toLowerCase().trim(),
          phone: clientPhone || '',
          status: 'active',
        });
      }
    }

    // Determine price from therapist offerings or fallback
    const offering = therapist.sessionOfferings?.find((o) => o.title === serviceName);
    const price = offering ? offering.price : 2000;

    // 3. Create appointment
    let newAppointment;
    const sessionData = {
      therapistId: therapist._id,
      clientId: client._id,
      serviceName,
      duration: parsedDuration,
      startDateTime: startDate,
      endDateTime: endDate,
      status: 'confirmed',
      clientTimezone,
      price,
      paymentStatus: paymentMethod === 'pay_later' ? 'unpaid' : 'paid',
      meetLink: `https://meet.google.com/unf-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`,
      clientNotes: clientNotes || '',
    };

    if (useTransaction) {
      newAppointment = (await Session.create([sessionData], { session: dbSession }))[0];
      await dbSession.commitTransaction();
      dbSession.endSession();
    } else {
      newAppointment = await Session.create(sessionData);
    }

    // 4. Trigger notifications asynchronously
    notificationService.notifyBookingConfirmed(newAppointment, therapist, client).catch((err) => {
      console.error('[Notification Trigger Error]:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Appointment successfully confirmed!',
      appointment: newAppointment,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
      },
    });
  } catch (error) {
    if (useTransaction && dbSession) {
      await dbSession.abortTransaction();
      dbSession.endSession();
    }
    console.error('[Atomic Booking Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to book appointment.' });
  }
};

/**
 * List appointments for therapist dashboard with date/status filters
 */
exports.getAppointments = async (req, res) => {
  try {
    const { status, startDate, endDate, clientId } = req.query;
    let filter = {};

    if (req.user.role === 'client') {
      filter.clientId = req.user.id;
    } else if (req.user.role === 'therapist') {
      filter.therapistId = req.user.id;
      if (clientId) filter.clientId = clientId;
    } else if (req.user.role === 'admin') {
      if (clientId) filter.clientId = clientId;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (startDate && endDate) {
      filter.startDateTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const appointments = await Session.find(filter)
      .populate('clientId', 'name email phone status')
      .populate('paymentId', 'amount invoiceNumber status')
      .sort({ startDateTime: 1 });

    res.json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update appointment status (complete, cancel, reschedule, no-show)
 */
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;

    const appointment = await Session.findOne({
      _id: id,
      therapistId: req.user.id,
    }).populate('clientId', 'name email phone');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    appointment.status = status;
    if (status === 'cancelled') {
      appointment.cancelledBy = req.user.role;
      appointment.cancelledAt = new Date();
      if (cancellationReason) appointment.cancellationReason = cancellationReason;

      const therapist = await Therapist.findById(appointment.therapistId);
      notificationService.notifyCancellation(appointment, therapist, appointment.clientId, req.user.role).catch(console.error);
    }

    await appointment.save();

    res.json({
      success: true,
      message: `Appointment marked as ${status}.`,
      appointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
