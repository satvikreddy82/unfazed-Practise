const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/schedulingController');
const { authenticate, requireRole } = require('../middleware/auth');

// Public slots and booking endpoints
router.get('/public/:slug/slots', schedulingController.getPublicAvailableSlots);
router.post('/book', schedulingController.bookAppointment);

// Private therapist scheduling management
router.get('/availability', authenticate, requireRole('therapist'), schedulingController.getAvailability);
router.put('/availability', authenticate, requireRole('therapist'), schedulingController.updateAvailability);
router.get('/appointments', authenticate, schedulingController.getAppointments);
router.put('/appointments/:id/status', authenticate, requireRole('therapist'), schedulingController.updateAppointmentStatus);

module.exports = router;
