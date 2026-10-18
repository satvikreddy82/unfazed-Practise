const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmController');
const { authenticate, requireRole } = require('../middleware/auth');

// Public lead capture from branded profile
router.post('/leads/public/:slug', crmController.capturePublicLead);

// Therapist Client CRM routes
router.get('/clients', authenticate, requireRole('therapist'), crmController.getClients);
router.post('/clients', authenticate, requireRole('therapist'), crmController.createClient);
router.get('/clients/:id', authenticate, requireRole('therapist'), crmController.getClientDetails);
router.put('/clients/:id', authenticate, requireRole('therapist'), crmController.updateClient);

// Therapist Lead management routes
router.get('/leads', authenticate, requireRole('therapist'), crmController.getLeads);
router.put('/leads/:id', authenticate, requireRole('therapist'), crmController.updateLead);
router.post('/leads/:id/convert', authenticate, requireRole('therapist'), crmController.convertLeadToClient);

// Intake & Consent routes (shared by therapist and client)
router.post('/intake', authenticate, crmController.submitIntake);
router.post('/intake/submit', authenticate, crmController.submitIntake);
router.post('/consent', authenticate, crmController.agreeConsent);
router.post('/consent/agree', authenticate, crmController.agreeConsent);

module.exports = router;
